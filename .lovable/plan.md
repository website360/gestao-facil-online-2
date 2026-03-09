

## Plano: Aba de Configuração do Bling nas Configurações do Sistema

### Objetivo
Criar uma nova aba "Bling" na tela de Configurações para armazenar as credenciais da API do Bling (client_id, client_secret, refresh_token), seguindo o mesmo padrão já usado para Correios e outras configurações.

### Abordagem
O projeto já armazena credenciais de integração (ex: Correios) na tabela `system_configurations` com chave/valor. Vamos seguir exatamente o mesmo padrão para o Bling.

### Implementação

**1. Criar componente `BlingConfigurationTab.tsx`**
- Campos: Client ID, Client Secret, Refresh Token, URL de callback (readonly, informativo)
- Switch para habilitar/desabilitar integração
- Botão "Testar Conexão" para validar as credenciais
- Salva tudo na `system_configurations` com key `bling_config` (mesmo padrão do `correios_config`)
- Campos de secret com type="password" e toggle de visibilidade

**2. Adicionar aba no `ConfigurationManagement.tsx`**
- Nova aba "Bling" com ícone, disponível para admin (junto com Correios e Desconto)
- Import do novo componente

**3. Sem alterações no banco de dados**
- Reutiliza a tabela `system_configurations` existente, que já tem RLS configurada para admin

### Detalhes Técnicos
- A configuração será armazenada como JSON na coluna `value` da `system_configurations` com `key = 'bling_config'`
- Campos sensíveis (client_secret, refresh_token) exibidos como `type="password"`
- Inclui seção informativa com link para o painel de desenvolvedores do Bling e instruções de como obter as credenciais
- A Edge Function `send-to-bling` (implementação futura) lerá essas configurações da mesma forma que a `calculate-shipping` lê o `correios_config`

