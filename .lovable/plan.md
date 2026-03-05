

## Diagnóstico do Problema

O problema persistente de corte tem uma causa raiz simples: o conteúdo da etiqueta ocupa quase toda a área de 100x78mm do PDF, mas a Datamax possui margens físicas não imprimíveis de ~4-6mm em cada lado. As correções anteriores ajustaram margens em 1-2mm de cada vez, nunca criando espaço suficiente.

Além disso, o QZ Tray está com `scaleContent: false`, o que significa que o PDF é enviado em tamanho 1:1 e tudo que cai fora da área imprimível da Datamax é simplesmente cortado.

## Solução Definitiva

A abordagem é criar uma **zona segura agressiva** dentro do PDF e usar o QZ Tray para escalar o conteúdo para caber na área imprimível.

### Mudança 1: `pdfLabelGenerator.ts` -- Redesenho completo do layout

Reescrever a função `drawLabel` com as seguintes alterações:

- **Margens muito maiores**: `ML=8, MR=8, MT=12, MB=12` (total: 16mm horizontais, 24mm verticais consumidos por margens)
- **Área útil resultante**: 84mm x 54mm (dentro de 100x78mm)
- **Proporções das seções**:
  - Header: 8mm (logo 6x6mm, nome da empresa em 7pt)
  - Cliente: 26mm (nome em 7.5pt, label "CLIENTE" em 6pt)
  - Rodapé (NF/Volume/Data): 20mm (labels em 5.5pt, valores em 6.5pt, volume em 7pt)
- **Sem borda externa** (a borda ocupava espaço e era cortada, causando a impressão de "película branca")
- **Fontes significativamente menores** em todas as seções para garantir que nada exceda a área útil
- **Logo reduzido** para 6x6mm

```text
┌──────────────── 100mm ────────────────┐
│  8mm                           8mm    │
│  ┌─────────── 84mm ──────────┐        │
│  │  LOGO  IRMAOS MANTOVANI   │ 12mm   │ MT
│  │────────────────────────────│        │
│  │ CLI │  NOME DO CLIENTE     │        │
│  │ENTE │  (até 3 linhas 7pt) │ 26mm   │
│  │────────────────────────────│        │
│  │ NF: xxx │ VOL: 1/3 │ DATA │ 20mm   │
│  └────────────────────────────┘        │
│                                 12mm   │ MB
└────────────────────────────────────────┘
         Área útil: 84 x 54mm
```

### Mudança 2: `qzTrayPrinter.ts` -- Configuração de impressão

Na função `printPdfDirect`, alterar a configuração do QZ Tray:

```typescript
const config = qz.configs.create(selectedPrinter, {
  units: 'mm',
  size: { width: 100, height: 78 },
  orientation: 'landscape',
  scaleContent: true,    // CRÍTICO: permite ao driver escalar para a área imprimível
  rasterize: true,
  density: 'best',
  interpolation: 'nearest-neighbor',
  colorType: 'blackwhite',
});
```

A combinação de `scaleContent: true` com conteúdo centralizado e compacto garante que o driver da Datamax redimensione o PDF para caber 100% na área imprimível, eliminando qualquer corte.

### Resumo das mudanças

| Arquivo | O que muda |
|---------|-----------|
| `pdfLabelGenerator.ts` | Reescrita completa do `drawLabel`: margens 8/8/12/12mm, fontes 30% menores, logo 6x6mm, sem borda externa, área útil 84x54mm |
| `qzTrayPrinter.ts` | `scaleContent: true` na config do `printPdfDirect` |

