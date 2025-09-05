Integração dos Correios ajustada com sucesso! 

## Modificações Implementadas:

✅ **Configurações dos Correios atualizadas:**
- Substituído "senha" por "código de acesso à API"
- Adicionadas configurações de unidades (peso: kg/g, dimensão: cm, moeda: R$)
- Novo campo "tipo de empacotamento" (real/cubagem)
- Campos para valor adicional e prazo adicional
- Manual passo-a-passo melhorado com links oficiais dos Correios

✅ **Campo de peso adicionado nos produtos:**
- Novo componente `ProductWeightForm` criado
- Campos `weight` e `weight_unit` adicionados ao banco de dados
- Interface de cadastro atualizada para incluir peso obrigatório

✅ **Nova lógica condicional no orçamento:**
- Campo CEP aparece apenas quando PAC ou SEDEX é selecionado
- Botão "Usar CEP do Cliente" disponível
- Cálculo automático baseado no peso real dos produtos
- Outras opções de frete funcionam normalmente

✅ **Componentes criados/atualizados:**
- `ProductWeightForm.tsx` - Formulário de peso do produto
- `ConditionalShippingSection.tsx` - Seção condicional de frete
- Interface de configuração melhorada com documentação completa

As alterações seguem exatamente suas especificações e incluem um manual completo com passo-a-passo e links oficiais dos Correios para facilitar a configuração.