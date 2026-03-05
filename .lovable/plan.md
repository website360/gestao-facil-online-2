

## Problem

The current label has massive margins (MT=30mm top, ML=30mm left, MB=14mm bottom) leaving only **16mm** of usable content height on a 78mm tall page. This crushes all 3 rows into a tiny space, causing the bottom row (VOLUME) to disappear or get clipped.

## Plan

Redistribute the layout so the content fills the entire label proportionally. The key change is to **reduce the top margin from 30mm to 8mm** and **bottom margin from 14mm to 6mm**, giving ~64mm of content height instead of 16mm. Left margin stays at 8mm (per the memory note about Datamax safe margins). All three rows (Header, Cliente, NF/Volume/Data) will scale up proportionally to fill the space.

### New Layout (100mm x 78mm page)

```text
┌──────────────────────────────────┐
│  MT = 8mm                        │
│  ┌────────────────────────────┐  │
│  │ HEADER (Logo + Nome) 16mm │  │  ML=8mm, MR=4mm
│  ├────────────────────────────┤  │
│  │ CLIENTE            28mm   │  │
│  ├──────────┬────────┬───────┤  │
│  │ NF 20mm  │VOLUME  │ DATA │  │  bottomH = 20mm
│  └──────────┴────────┴───────┘  │
│  MB = 6mm                        │
└──────────────────────────────────┘
```

### Changes in `pdfLabelGenerator.ts`

1. **Margins**: `MT=8, MB=6, ML=8, MR=4` → `contentH = 64mm`, `contentW = 88mm`
2. **Row heights**: `headerH=16mm`, `clientH=28mm`, `bottomH=20mm` — all scaled proportionally
3. **Font sizes**: Scale up proportionally (~2-3x) since we have ~4x more space
4. **Logo**: Scale up to ~14x14mm to match the larger header
5. **Client text**: Larger font, more room for long names
6. **Bottom row values**: Larger fonts, centered vertically with plenty of clearance

This ensures the label fills the full paper and no information is cut off.

