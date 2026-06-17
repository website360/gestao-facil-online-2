# Integração com o Bling ERP

Integração para enviar **vendas faturadas** do sistema como **pedidos de venda** no Bling ERP (API v3 / OAuth 2.0), incluindo contato do cliente, itens, frete e parcelas.

O envio é **manual** (por venda) e fica disponível para os papéis **Nota Fiscal** e **Admin**.

---

## Passo a passo

### Parte 1 — Criar o aplicativo no Bling
1. Acesse o [Painel de Desenvolvedores do Bling](https://developer.bling.com.br) e faça login.
2. Clique em **Criar aplicativo** e escolha **Aplicativo privado** (uso da própria empresa).
3. No campo **URL de redirecionamento (callback)**, cole a URL exibida em *Configurações → Bling → URL de Callback*.
   - Formato: `https://<PROJECT_ID>.supabase.co/functions/v1/bling-oauth-callback`
4. Em **Escopos / Permissões**, marque (leitura e escrita): **Pedidos de Venda**, **Contatos** e **Formas de Pagamento**.
5. Salve e copie o **Client ID** e o **Client Secret**.

### Parte 2 — Conectar o sistema ao Bling
1. Em *Configurações → Bling*, ative a integração (botão **Ativado**).
2. Cole **Client ID** e **Client Secret** e clique em **Salvar Configurações**.
3. No painel do Bling, copie o **Link de Convite** do aplicativo e abra em nova aba.
4. Autorize — o Bling redireciona de volta e o **Status da Autorização** muda para *Autorizado*.

### Parte 3 — Mapear as formas de pagamento
1. Na seção **Formas de pagamento**, clique em **Buscar do Bling**.
2. Relacione cada forma de pagamento local com a forma equivalente no Bling.
3. Defina a **Forma padrão (fallback)**.
4. **Salvar Configurações**. Sem mapeamento, o pedido é enviado **sem parcelas**.

### Parte 4 — Testar e enviar
1. Ative o **Modo de teste (dry-run)** e salve. Valida o envio **sem** criar pedidos no Bling.
2. Na tela de **Vendas**, clique no ícone do Bling em uma venda faturada.
3. Confira o resultado no **Log de envios ao Bling**.
4. Com tudo certo, **desligue o dry-run** e salve — os envios passam a criar o pedido real.
5. Em caso de falha, use **Reenviar** na tela de log.

---

## Como funciona (técnico)

| Componente | Local | Função |
|-----------|-------|--------|
| `send-to-bling` | `supabase/functions/send-to-bling` | Refaz token OAuth, busca/cria contato, monta pedido (itens + frete + parcelas), envia para `/pedidos/vendas`, grava retorno e log. Aceita `dry_run`. |
| `bling-oauth-callback` | `supabase/functions/bling-oauth-callback` | Troca o `code` da autorização por tokens (access/refresh). |
| `bling-formas-pagamento` | `supabase/functions/bling-formas-pagamento` | Lista as formas de pagamento do Bling para o mapeamento. |
| `BlingConfigurationTab` | `src/components/configuration` | Tela de configuração (credenciais, dry-run, mapeamento, guia). |
| `BlingSyncLogs` | `src/components/configuration` | Tela de log de envios + reenvio. |

### Dados gravados na venda (`sales`)
- `bling_order_id` — ID do pedido no Bling (impede reenvio).
- `bling_order_number` — número do pedido retornado.
- `bling_status` — situação do pedido no Bling.
- `bling_sent_at` — data/hora do último envio com sucesso.
- `bling_last_error` — mensagem do último erro.

### Configuração (`system_configurations`, chave `bling_config`)
JSON com: `enabled`, `client_id`, `client_secret`, `refresh_token`, `access_token`, `access_token_expires_at`, `authorized`, `dry_run`, `payment_method_map` (mapa forma local → ID Bling) e `default_forma_pagamento_id`.

### Parcelas
São montadas a partir dos campos da venda:
- `boleto_due_dates` / `check_due_dates` (dias para vencimento) quando existirem;
- senão, `installments` (parcelas mensais 30/60/90…);
- senão, 1 parcela à vista.

O valor é dividido igualmente (ajuste de centavos na última) e cada parcela recebe a `formaPagamento.id` do mapeamento.

---

## Observações importantes
- O pedido de venda **não emite NF-e** automaticamente — a emissão continua sendo feita dentro do Bling.
- Uma venda já enviada (`bling_order_id` preenchido) **não é reenviada** (evita duplicidade).
- O Bling **não possui ambiente de testes (sandbox)**: use o **dry-run** ou uma **conta/empresa Bling de teste**.
- Permissão de envio: papéis **Nota Fiscal** e **Admin**.

## Deploy
- **Backend** (migrations + edge functions): aplicado pelo Lovable no push para a `main`.
- **Frontend**: build/deploy na DigitalOcean a partir da `main`.
