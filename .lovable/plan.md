

# Corrigir Etiquetas de Volume para Impressora Datamax E-4204B via Windows

## Problema

Ao imprimir pelo driver do Windows (em vez do BarTender Enterprise), as etiquetas apresentam dois problemas:

1. **Espaço em branco** de uma etiqueta entre cada etiqueta impressa (pula uma etiqueta)
2. **Impressao clara/fraca** - o preto nao sai forte como no BarTender

Esses problemas acontecem porque o driver do Windows adiciona margens extras e o navegador envia os dados como grafico rasterizado com dithering, enquanto o BarTender envia comandos nativos (DPL/ZPL) direto para a impressora.

## Solucao

Vou aplicar tecnicas agressivas de CSS e HTML para forcar o comportamento correto no driver Windows:

### 1. Eliminar o espaco entre etiquetas

- Remover `padding: 3mm` do `.label` (a margem interna sera apenas no `.label-inner`)
- Definir `@page` com `size: 100mm 60mm` e `margin: 0`
- Adicionar `height: 60mm` exato e `overflow: hidden` para que o driver nao adicione espaco extra
- Usar `page-break-after: always` sem nenhum gap

### 2. Forcar preto solido

- Usar `filter: contrast(2)` no body durante impressao para forcar alto contraste
- Aumentar espessura das bordas para `3px solid #000`
- Usar `text-shadow: 0 0 0 #000` em todos os textos para reforcar o preenchimento
- Adicionar `-webkit-text-stroke: 0.5px #000` para engrossar as letras
- Aplicar `font-weight: 900` em todos os elementos de texto

### 3. Instrucoes de configuracao do driver

Alem das mudancas no codigo, vou adicionar um aviso na interface com dicas para configurar o driver da Datamax no Windows:
- Velocidade de impressao: reduzir para 2-3 ips
- Darkness/Heat: aumentar para 20-25
- Formato do papel: personalizado 100x60mm sem margens

## Arquivo a ser editado

- `src/components/conference/VolumeLabelPrinter.tsx`
  - Remover padding do `.label`, mover para `.label-inner`
  - Adicionar `text-shadow` e `-webkit-text-stroke` para texto mais escuro
  - Aumentar bordas para 3px
  - Adicionar `filter: contrast(2)` no `@media print`
  - Adicionar dica visual sobre configuracao do driver antes do botao de imprimir

