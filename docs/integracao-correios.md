# Manual de Integração com os Correios

## Visão Geral

Esta documentação detalha como configurar e utilizar a integração com a API dos Correios para cálculo automático de frete no sistema de gestão.

## Pré-requisitos

### 1. Contrato com os Correios

Para utilizar a integração, você precisa ter:

- **Contrato ativo** com os Correios para serviços de encomenda
- **Credenciais de acesso** à API (usuário e senha)
- **Cartão de postagem** ativo
- **CEP de origem** configurado (local de onde os produtos serão enviados)

### 2. Cadastro de Produtos

Para o cálculo de frete funcionar corretamente, os produtos devem ter as **dimensões preenchidas**:

- **Largura** (em cm)
- **Comprimento** (em cm) 
- **Espessura/Altura** (em cm)
- **Peso** (estimado automaticamente em 1kg por item, mas pode ser ajustado)

> ⚠️ **Importante**: Produtos sem dimensões não serão considerados no cálculo de frete.

## Configuração Passo a Passo

### Passo 1: Obtendo Credenciais dos Correios

1. **Acesse o site dos Correios** para empresas
2. **Contrate o serviço** de API para e-commerce
3. **Receba as credenciais**:
   - Usuário (login)
   - Senha
   - Cartão de postagem
4. **Anote o CEP** do local de origem dos envios

### Passo 2: Configurando no Sistema

1. **Acesse o sistema** como administrador
2. **Navegue para**: Configurações → Correios
3. **Preencha os campos**:
   - ✅ **Ativar integração com Correios**
   - **Usuário**: Seu login dos Correios
   - **Senha**: Sua senha dos Correios  
   - **Cartão de Postagem**: Número fornecido pelos Correios
   - **CEP de Origem**: CEP de onde os produtos são enviados
4. **Escolha os serviços**:
   - ✅ **PAC** (Encomenda Econômica)
   - ✅ **SEDEX** (Encomenda Expressa)
5. **Clique em "Salvar Configurações"**

### Passo 3: Testando a Configuração

1. **Na tela de configurações**, clique em **"Testar Configuração"**
2. O sistema fará um teste com:
   - CEP de destino: 01310-100 (Paulista - SP)
   - Dimensões padrão de teste
3. **Verifique se** aparecem os valores de PAC e SEDEX
4. Se houver erro, **revise as credenciais**

## Utilizando nos Orçamentos

### Preenchendo Dimensões dos Produtos

1. **Acesse**: Produtos → Editar Produto
2. **Na seção "Medidas"**, preencha:
   - **Largura** (cm)
   - **Comprimento** (cm)
   - **Espessura** (cm)
   - **Diâmetro** (quando aplicável)
3. **Salve o produto**

### Calculando Frete no Orçamento

1. **Crie ou edite** um orçamento
2. **Adicione os produtos** desejados
3. **Na seção "Cálculo de Frete"**:
   - Digite o **CEP de destino**
   - Ou clique em **"Usar CEP do Cliente"** (se cadastrado)
4. **Clique em "Calcular Frete"**
5. **Selecione** a opção desejada (PAC ou SEDEX)
6. O valor será **automaticamente adicionado** ao orçamento

## Campos Obrigatórios

### No Cadastro de Produtos
- ✅ **Largura** (cm) - obrigatório
- ✅ **Comprimento** (cm) - obrigatório  
- ✅ **Espessura** (cm) - obrigatório
- ⚪ **Diâmetro** (cm) - opcional

### No Cadastro de Clientes  
- ✅ **CEP** - recomendado para facilitar orçamentos

### Nas Configurações dos Correios
- ✅ **Usuário** - obrigatório
- ✅ **Senha** - obrigatório
- ✅ **Cartão de Postagem** - obrigatório
- ✅ **CEP de Origem** - obrigatório

## Como Funciona o Cálculo

### Dimensões da Encomenda
O sistema calcula automaticamente:
- **Peso**: 1kg × quantidade de itens
- **Largura**: Maior largura entre todos os produtos
- **Comprimento**: Maior comprimento entre todos os produtos  
- **Altura**: Soma das espessuras (quantidade × espessura)

### Limites dos Correios
O sistema respeita os limites mínimos:
- **Peso mínimo**: 100g
- **Altura mínima**: 2cm
- **Largura mínima**: 11cm
- **Comprimento mínimo**: 16cm

## Serviços Disponíveis

### PAC (Encomenda Econômica)
- **Código**: 04669
- **Prazo**: ~7 dias úteis
- **Custo**: Mais econômico
- **Ideal para**: Entregas não urgentes

### SEDEX (Encomenda Expressa)  
- **Código**: 04162
- **Prazo**: ~2 dias úteis
- **Custo**: Mais caro
- **Ideal para**: Entregas urgentes

## Resolução de Problemas

### Erro: "Configuração dos Correios não encontrada"
- ✅ Verifique se salvou as configurações
- ✅ Confirme se ativou a integração

### Erro: "Configuração dos Correios incompleta"  
- ✅ Preencha todos os campos obrigatórios
- ✅ Verifique usuário, senha, cartão e CEP origem

### Erro: "CEP inválido"
- ✅ CEP deve ter 8 dígitos (formato: 00000-000)
- ✅ Verifique se o CEP existe

### Erro: "Produtos sem dimensões"
- ✅ Cadastre largura, comprimento e espessura
- ✅ Verifique se os produtos do orçamento têm medidas

### Frete não aparece no orçamento
- ✅ Adicione pelo menos 1 produto no orçamento
- ✅ Verifique se o produto tem dimensões cadastradas
- ✅ Teste a configuração dos Correios

## Dicas e Boas Práticas

### 📦 Dimensões dos Produtos
- Meça produtos físicos com precisão
- Considere embalagem no cálculo das dimensões
- Mantenha um padrão de medidas (sempre em cm)

### 🎯 CEPs dos Clientes  
- Cadastre CEPs dos clientes para agilizar orçamentos
- Mantenha cadastros atualizados
- Valide CEPs no momento do cadastro

### ⚡ Performance
- Configurações são carregadas automaticamente
- Cálculos são feitos em tempo real
- Cache de configurações melhora velocidade

### 🔒 Segurança
- Credenciais são armazenadas criptografadas
- Acesso restrito a administradores
- Log de todas as operações

## Suporte Técnico

### Para problemas com:
- **Credenciais**: Entre em contato com os Correios
- **API**: Verifique status no site dos Correios
- **Sistema**: Contate o suporte técnico

### Links Úteis
- [Site dos Correios - Empresas](https://www.correios.com.br)
- [Central de Atendimento](https://www.correios.com.br/fale-conosco)
- [Documentação da API](https://www.correios.com.br/para-sua-empresa/servicos-para-o-seu-e-commerce)

---

**Versão do Manual**: 1.0  
**Última Atualização**: Janeiro 2025  
**Sistema**: Gestão Comercial v2.0