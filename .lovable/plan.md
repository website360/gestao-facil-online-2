

## Problema atual

A escala de 92% combinada com margens de 5mm em cada lado cria **dupla redução**: o conteúdo fica minúsculo e com muito espaço em branco, mas as laterais ainda cortam porque a impressora tem margem física própria que se sobrepõe.

## Solução

Remover completamente o fator de escala (92%) e usar margens mínimas com fontes em tamanho real. O conteúdo deve ocupar o máximo da etiqueta.

### Mudanças em `pdfLabelGenerator.ts`

1. **Remover SCALE**: eliminar `SCALE_PERCENT`, `SCALE` e toda a lógica de `scaledW/scaledH/offsetX/offsetY`
2. **Reduzir margens**: de 5/5/4/4mm para **3/3/2/2mm** (ML/MR/MT/MB), resultando em area util de **94x56mm**
3. **Fontes em tamanho real** (sem multiplicar por SCALE):
   - Empresa: **9pt** bold
   - Label "CLIENTE": **7pt** bold
   - Nome cliente: **9pt** bold
   - Rodape labels: **6pt** bold
   - Rodape valores: **8pt** bold
   - Volume: **10pt** bold
   - Data: **7pt**
4. **Layout proporcional** na area util de 94x56mm:
   - Header: 10mm
   - Cliente: 28mm
   - Rodape: 18mm
5. **Desenhar direto** nas coordenadas ML/MT sem transformacao de escala

### Mudanças em `qzTrayPrinter.ts`

- Manter configuracao atual (swap de dimensoes para Datamax, scaleContent, rasterize)
- Sem alteracoes necessarias

### Resultado esperado
- Fontes visiveis e legiveis
- Conteudo preenchendo a etiqueta sem espacos em branco excessivos
- Margens minimas para evitar corte lateral

