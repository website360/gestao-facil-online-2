
# Escurecer Etiquetas para Impressora Termica

## Problema
As etiquetas estao saindo claras na impressora termica. O metodo atual ja usa double-strike (texto desenhado 2x com offset de 0.1mm), mas nao e suficiente para impressoras termicas que precisam de mais area de contato para aquecer o papel.

## Solucao

Aplicar multiplas tecnicas combinadas no arquivo `pdfLabelGenerator.ts` para maximizar a escuridao:

### 1. Triple-strike no texto (em vez de double)
Desenhar cada texto 3 vezes com offsets diferentes (0, +0.15, +0.3mm) para criar uma mancha mais densa e escura.

### 2. Aumentar fontes em todos os campos
- Header: 12pt para 14pt
- Labels (CLIENTE, NF, VOLUME, DATA): 9pt para 11pt
- Valores nos campos: 10-11pt para 12-13pt

### 3. Engrossar todas as linhas
- Borda externa: 1.6 para 2.0mm
- Caixas de dados: 1.0 para 1.4mm
- Linha separadora: 0.8 para 1.2mm

### 4. Preencher retangulos de fundo nos labels
Adicionar retangulos preenchidos (filled rects) atras dos labels "CLIENTE", "NOTA FISCAL", "VOLUME", "DATA" com texto branco invertido. Isso forca a impressora termica a aquecer uma area grande, garantindo contraste maximo.

### 5. Adicionar linhas horizontais extras
Linhas divisorias adicionais entre secoes para reforcar a estrutura visual.

## Detalhes Tecnicos

### Arquivo: `src/components/conference/pdfLabelGenerator.ts`

- Refatorar `boldText` para desenhar 3 camadas com offsets `[0, 0.15, 0.3]` em X e `[0, 0.1]` em Y
- Aumentar todos os `setFontSize` conforme descrito
- Aumentar todos os `setLineWidth` conforme descrito
- Adicionar `doc.rect(x, y, w, h, 'F')` (filled) para labels com texto invertido branco via `setTextColor(255,255,255)` seguido de reset para preto
- Manter o layout e posicionamento geral inalterados, apenas reforcar peso visual

Nenhuma alteracao no `VolumeLabelPrinter.tsx` - o fluxo de impressao via iframe permanece igual.
