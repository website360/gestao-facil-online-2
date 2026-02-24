
# Reverter Etiquetas ao Estilo Original + Corrigir Erros de Build

## Objetivo
Reverter o estilo das etiquetas para o formato original (bordas finas, texto simples) que imprimia corretamente, e corrigir os erros de build nas edge functions.

## Alteracoes

### 1. Reverter `pdfLabelGenerator.ts` ao estilo simples
- Remover triple-strike: `boldText` volta a desenhar texto apenas 1 vez (texto normal)
- Remover labels invertidos (fundo preto com texto branco)
- Bordas finas: outer border `0.5mm`, caixas `0.3mm`, separadores `0.3mm`
- Fontes menores: header `12pt`, labels `9pt`, valores `10pt`
- Remover separadores extras entre secoes
- Manter layout e posicionamento dos campos iguais

### 2. Corrigir erros de build nas edge functions
- `calculate-shipping/index.ts` (linha 172-173): adicionar `?? 0` para `price` e `delivery_time`
- `delete-user/index.ts` (linha 187): cast `cleanError` para `Error`
- `delete-user/index.ts` (linhas 222-223): cast `error` para `Error`
- `update-user-email/index.ts` (linha 98): cast `error` para `Error`
- `update-user-password/index.ts` (linha 106): cast `error` para `Error`

## Detalhes Tecnicos

### Arquivo: `src/components/conference/pdfLabelGenerator.ts`
Reescrever com estilo leve:
- `boldText` removido ou substituido por chamada simples `doc.text()`
- Sem `invertedLabel` - labels serao texto bold normal
- `setLineWidth(0.5)` para borda externa, `0.3` para caixas internas
- Fontes: header 12pt, labels 9pt, valores 10pt
- Sem retangulos preenchidos (sem `'F'`)

### Arquivos de edge functions
Adicionar type assertions `(error as Error).message` nos catches para resolver erros TypeScript.
