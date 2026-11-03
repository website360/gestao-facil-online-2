# Portal do Cliente: sessão com token e acompanhamento do pedido

## O problema original

O pedido do cliente vive em duas tabelas: começa em `budgets` e, quando
aprovado, passa a existir também em `sales` (o orçamento fica com status
`convertido`).

O painel do cliente escondia todo orçamento `convertido` e contava com uma
segunda consulta (`sales` por `client_id`) para o pedido reaparecer como venda.
Quando essa consulta não trazia a venda, **o pedido desaparecia da tela** — o
orçamento estava escondido e a venda não aparecia. Dois motivos reais para ela
não trazer:

1. **Sem identidade no banco.** O portal não usa o auth do Supabase: o login é
   feito pela edge function `client-login`, que valida `clients.email` +
   `clients.system_password` e guarda a resposta no `localStorage`. Logo, toda
   consulta do painel chegava como role `anon` — sem identidade alguma. A
   leitura das vendas dependia da política `"Clients can view their own sales"`
   (`20250723003621`), cuja subconsulta lê `clients`, que por sua vez dependia
   de `"Anon can view system-enabled clients"` (`20250916150636`). Corrente
   frágil: qualquer ajuste em `clients` derrubava o painel — e foi o que
   aconteceu em `20250910204250`, que removeu o trecho `allow_system_access` da
   política de `clients`.
2. **Vínculo só por `client_id`.** Vendas geradas com outro `client_id` (ex.:
   pela tela `BudgetApproval`) perdiam o vínculo com o cliente.

Havia ainda um terceiro sumiço, independente de status: o painel herdava a
janela de 45 dias de `useBudgetManagement`, então pedido em andamento há mais de
45 dias saía da tela.

E, como efeito colateral do modelo "tudo aberto para `anon`", qualquer pessoa
com a chave pública do frontend podia ler (e em parte escrever) dados de todos
os clientes do portal — inclusive `system_configurations`, que guarda as
credenciais do Bling e dos Correios.

## Fase 1 — identidade de verdade

`supabase/migrations/20261103130000_client_portal_sessions.sql`

- Tabela `client_sessions` (`client_id`, `token_hash`, `expires_at`), com RLS
  habilitado e **sem nenhuma policy**: inacessível por `anon` e por
  `authenticated`. Só a `service_role` (edge function) e as funções
  `SECURITY DEFINER` chegam nela.
- `client-login` gera um token aleatório de 256 bits, guarda apenas o **hash
  SHA-256** e devolve o token ao navegador. Sessão de 30 dias.
- A edge function **não devolve mais `system_password`**. Antes a senha do portal
  ia para o `localStorage` do cliente em texto puro; `useAuth` também limpa o
  campo de sessões que já estavam salvas.
- `client_portal_sales(p_token)` resolve o token → `client_id` e devolve apenas
  as vendas daquele cliente, com itens, produtos, dados do cliente e as datas de
  cada etapa (`separation_completed_at`, `conference_completed_at`,
  `invoice_completed_at`, `delivery_completed_at`). Considera `client_id` **e**
  as vendas vindas dos orçamentos do cliente.
- `client_portal_logout(p_token)` encerra a sessão.

## Fase 2 — fechar o acesso `anon`

`supabase/migrations/20261103140000_client_portal_scoped_access.sql`

RPCs novas, todas `SECURITY DEFINER` e escopadas ao token:

| RPC | Para quê |
|---|---|
| `client_portal_me` | cadastro do próprio cliente (CEP do frete, documentos do PDF) |
| `client_portal_budgets` | listagem dos orçamentos do cliente, com itens e produtos |
| `client_portal_save_budget` | criar/editar orçamento e substituir os itens |
| `client_portal_submit_budget` | enviar para aprovação |
| `client_portal_delete_budget` | excluir (só antes de aprovado) |
| `client_portal_config` | lista branca de configurações (desconto máximo, layout do PDF, se Correios está ativo) |

Políticas removidas (o portal não acessa mais essas tabelas direto):

- `budgets`: `Anon clients can create/view/update their own budgets` e as
  políticas `Clients can *` remanescentes;
- `budget_items`: idem;
- `sales` / `sale_items`: `Clients can view their own sale(s)/sale items`;
- `clients`: `Anon can view system-enabled clients`;
- `system_configurations`: a política antiga tinha um ramo
  `EXISTS (SELECT 1 FROM clients WHERE allow_system_access = true)` que, para
  `anon`, era verdadeiro em qualquer requisição — ou seja, **as credenciais do
  Bling e dos Correios estavam legíveis com a chave pública**. Agora só a
  equipe autenticada lê a tabela, e o portal recebe a lista branca pela RPC.

**Continua aberto para `anon`, de propósito:** `products`, `categories`,
`payment_methods`, `payment_types` e `shipping_options`. São dados de catálogo,
já públicos pela rota `/catalog` do próprio site.

### Divisão de responsabilidades nas escritas

O cálculo dos totais e a deduplicação de itens continuam no JS
(`BudgetService.buildDeduplicatedItems` / `calculateTotalAmount`), que são as
mesmas regras usadas pelo painel interno — reimplementar isso em SQL seria
convite a divergência. A RPC cuida da **autorização**: força
`client_id`/`created_by` do dono da sessão, restringe os status que o cliente
pode gravar (`processando` / `aguardando_aprovacao`), exige que o orçamento
ainda esteja editável e aceita apenas as colunas da lista branca — por isso o
`UPDATE` é um *patch* (chave ausente mantém o valor atual), senão o modal do
cliente, que envia só parte dos campos, zeraria desconto e nota fiscal.

Efeito colateral bom: com a RPC o cliente finalmente consegue **remover** itens
de um orçamento. Antes não havia policy de DELETE em `budget_items` para `anon`,
e o modal precisava zerar a quantidade e fazer upsert.

## Fase 3 — o painel em si

`ClientWelcomeDashboard` passou a tratar o orçamento como a base do pedido; a
venda apenas enriquece o status. Mesmo que a venda não possa ser lida, o pedido
continua visível ("Aprovado - em preparação") em vez de desaparecer. Também:

- 8 etapas legíveis (`src/lib/clientOrderStatus.ts`), cobrindo todos os status
  de orçamento e de venda — antes `processando`, `aguardando_entrega`,
  `atencao` e `finalizada` apareciam como texto cru;
- modal de acompanhamento com linha do tempo
  (`src/components/client/ClientOrderTrackingModal.tsx`);
- venda sem orçamento correspondente na lista também aparece como pedido
  (pedido montado pela equipe, venda de balcão);
- fim do recorte de 45 dias no painel do cliente.

## Ordem de publicação

1. **Migrations primeiro** (`...130000` e depois `...140000`).
2. **Edge function `client-login`** depois.

A ordem inversa não quebra o portal: se `client_sessions` ainda não existir, o
login registra o erro no log e devolve o cliente **sem token**, e o painel cai
no caminho antigo de consulta. O mesmo vale para sessões que já estavam abertas
antes da mudança — elas seguem funcionando até o próximo login.

⚠️ Importante: a fase 2 remove as políticas `anon`. Depois dela, **uma sessão
sem token não consegue mais ler nem gravar orçamentos** — o cliente precisa
sair e entrar de novo para receber o token. Vale avisar os clientes do portal,
ou simplesmente esperar a expiração natural (o painel mostra "sua sessão
expirou" quando a RPC recusa o token).

## O que sobrou de dívida

- A senha do portal (`clients.system_password`) ainda é texto puro na tabela, e
  a comparação no `client-login` é feita por igualdade. O caminho é hash
  (bcrypt/argon2) na edge function. Isso **não** foi feito aqui.
- O portal continua sem rate limit no login.
- `Index.tsx` dá ao cliente um `userProfile.role = 'vendedor_externo'` para
  reaproveitar o formulário de orçamento. Funciona, mas é um disfarce que
  confunde a leitura do código.
