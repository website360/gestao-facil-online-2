

## Causa Raiz

O PDF está sendo gerado com formato **100x78mm**, mas a etiqueta física é **100x60mm**. Isso significa que o conteúdo é 30% mais alto que o papel real. O QZ Tray tenta encaixar 78mm em 60mm, resultando em corte em todas as direções e conteúdo ampliado.

Todas as correções anteriores de margem foram inúteis porque o problema fundamental é o tamanho errado do documento.

## Plano

### 1. Corrigir `pdfLabelGenerator.ts` -- Formato correto + etiqueta de calibração

- Alterar formato do PDF de `[100, 78]` para `[100, 60]`
- Redesenhar layout para caber em 100x60mm com margens seguras (ML=5, MR=5, MT=4, MB=4 = área útil 90x52mm)
- Adicionar uma **primeira página de calibração** que desenha um retângulo na borda exata da área útil com a mensagem "Se este retângulo estiver 100% visível, a calibração está correta" -- isso permite ao usuário validar visualmente

Layout dentro de 100x60mm:
```text
┌──────────── 100mm ────────────┐
│ 5mm                     5mm   │
│ ┌──────── 90mm ────────┐      │
│ │ LOGO  MANTOVANI      │ 4mm  │ MT
│ │──────────────────────│      │
│ │ CLI │ NOME CLIENTE   │ 28mm │
│ │──────────────────────│      │
│ │ NF:xx │ VOL:1/3│DATA │ 20mm │
│ └──────────────────────┘      │
│                          4mm  │ MB
└───────────────────────────────┘
       Área útil: 90 x 52mm
```

- Header: 8mm (logo 5x5mm, empresa 7pt)
- Cliente: 24mm (nome 7pt, label 5.5pt)  
- Rodapé: 20mm (NF/Volume/Data em 6pt)
- Fontes compactas para garantir que nada estoure

### 2. Corrigir `qzTrayPrinter.ts` -- Dimensão correta

- Alterar `LABEL_HEIGHT_MM` de `78` para `60`
- Manter `scaleContent: true` para o driver ajustar à área imprimível

### Resumo

| Arquivo | Mudança |
|---------|---------|
| `pdfLabelGenerator.ts` | Formato 100x60mm, layout redesenhado para 90x52mm útil, página de calibração |
| `qzTrayPrinter.ts` | `LABEL_HEIGHT_MM = 60` |

