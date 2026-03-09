

## Plano: Edge Function `send-to-bling` + Botão "Enviar para Bling" nas Vendas

### Objetivo
Criar uma Edge Function que envia pedidos de venda ao Bling ERP via API v3, e adicionar um botão na tabela de vendas para admin disparar o envio.

### Implementação

**1. Coluna `bling_order_id` na tabela `sales`**
- Migration para adicionar `bling_order_id TEXT NULL` na tabela `sales`
- Permite rastrear quais vendas já foram enviadas e evitar duplicações

**2. Edge Function `send-to-bling`**
- Lê as credenciais do Bling da `system_configurations` (key `bling_config`)
- Fluxo OAuth: usa `client_id` + `client_secret` + `refresh_token` para obter um `access_token` via `POST https://api.bling.com.br/Api/v3/oauth/token`
- Busca dados completos da venda (cliente, itens, produtos)
- Monta o payload para `POST https://api.bling.com.br/Api/v3/pedidos/vendas` com:
  - `contato`: nome e dados do cliente
  - `itens`: código do produto, quantidade, valor unitário, descrição
  - `data`, `totalProdutos`, `transporte`
- Salva o `bling_order_id` retornado na venda
- Atualiza o `refresh_token` na config (o Bling retorna um novo a cada troca)

**3. Botão "Enviar para Bling" no `SalesTableRow.tsx`**
- Visível apenas para admin
- Aparece nas vendas com status `nota_fiscal`, `aguardando_entrega`, `entrega_realizada` ou `finalizada`
- Ícone diferenciado: cinza se não enviado, verde se já enviado (com tooltip mostrando o ID do Bling)
- Ao clicar, chama `supabase.functions.invoke('send-to-bling', { body: { sale_id } })`

**4. Atualização do `SalesManagement.tsx`**
- Handler `handleSendToBling(saleId)` com loading state e toast de sucesso/erro
- Passar callback para `SalesTableRow`

**5. Config TOML**
- Adicionar `[functions.send-to-bling]` com `verify_jwt = false` (valida auth no código)

### Detalhes Técnicos

O fluxo de token do Bling v3:
```text
POST https://api.bling.com.br/Api/v3/oauth/token
Headers: Authorization: Basic base64(client_id:client_secret)
Body: grant_type=refresh_token&refresh_token=STORED_TOKEN
Response: { access_token, refresh_token (novo!), expires_in }
```

O `refresh_token` é rotativo (30 dias de validade, mas muda a cada uso), então a Edge Function salva o novo token de volta na `system_configurations` automaticamente.

Payload do pedido segue a estrutura da API v3:
```text
{
  "data": "2026-03-09",
  "contato": { "id" ou "nome", "tipoPessoa": "F/J", "numeroDocumento": "CPF/CNPJ" },
  "itens": [{ "codigo", "descricao", "unidade", "quantidade", "valor" }],
  "transporte": { "frete": valor }
}
```

