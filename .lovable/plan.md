

# Plano: Restaurar impressao de etiquetas funcional

## Diagnostico
O fluxo atual depende exclusivamente do QZ Tray, que requer software externo instalado e esta causando travamento na impressora. O caminho anterior via `directPrinter.ts` (window.open + window.print) tambem falha por bloqueios do Edge.

## Solucao pragmatica
Usar o PDF ja gerado (jsPDF) com `autoPrint()` embutido e abrir como blob URL em nova aba do navegador. O visualizador de PDF do proprio browser dispara a impressao automaticamente sem depender de QZ Tray nem de window.open+write.

### Fluxo
1. Gerar PDF com `generateVolumeLabelsPDF` (layout atual, 100x60mm)
2. Chamar `doc.autoPrint()` para embutir comando de impressao automatica no PDF
3. Converter para blob URL e abrir em nova aba (`window.open(blobUrl)`)
4. O navegador abre o PDF e dispara impressao automaticamente
5. Manter botao "Baixar PDF" como alternativa

### Alteracoes

**`src/components/conference/VolumeLabelPrinter.tsx`**
- Botao principal: chamar nova funcao `printVolumeLabelsDirect` que abre PDF com autoPrint em nova aba
- Remover dependencia do QZ Tray como caminho principal
- Remover aviso sobre QZ Tray
- Manter botao "Baixar PDF" como fallback

**`src/components/conference/pdfLabelGenerator.ts`**
- Adicionar funcao `printVolumeLabelsDirect(data)` que:
  - Gera o PDF
  - Chama `doc.autoPrint()`
  - Cria blob URL
  - Abre em nova aba com `window.open`

Nenhuma alteracao no layout da etiqueta - mantemos o estilo atual. Nenhuma dependencia de software externo.

