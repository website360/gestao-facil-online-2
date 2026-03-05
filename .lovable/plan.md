
Objetivo prioritário: garantir etiqueta 100% visível na Datamax, sem corte e sem sair em duas partes.

Diagnóstico rápido do estado atual (código real)
- A área útil atual já está em 90x52 mm (margens 5/5/4/4) em `pdfLabelGenerator.ts`.
- O formato está correto em 100x60 mm.
- O corte persistente indica problema de compatibilidade de renderização/impressora (QZ/driver/calibração física), não apenas layout.
- A função de calibração existe (`drawCalibrationPage`), mas não está exposta no fluxo principal da UI.

Plano de correção (implementação)
1) Travar “modo compatibilidade Datamax” no pipeline de impressão
- Arquivo: `src/components/conference/qzTrayPrinter.ts`
- Adicionar perfil de impressão com defaults conservadores:
  - `labelWidthMm: 100`, `labelHeightMm: 60`
  - `scalePercent: 92` (encolhimento real para garantir visibilidade total)
  - `offsetXMm: 0`, `offsetYMm: 0`
  - `swapWidthHeight: true` (workaround para casos de split/rotação de PDF em alguns drivers)
- Aplicar esse perfil no `qz.configs.create(...)`.
- Enviar `options.pageWidth/pageHeight` no comando `qz.print` (forçando página efetiva).
- Incluir fallback de 2ª tentativa automática (se erro de impressão): inverter W/H no job.

2) Aplicar escala/offset no desenho da etiqueta (não só no driver)
- Arquivo: `src/components/conference/pdfLabelGenerator.ts`
- Introduzir transformação centralizada (scale + translate) antes de `drawLabel`.
- Resultado: área útil efetiva passa de 90x52 para ~82.8x47.8 mm com `scalePercent=92`.
- Manter tipografia mais compacta para não estourar com nomes longos.
- Continuar sem borda externa.

3) Expor calibração e área útil no fluxo de usuário
- Arquivo: `src/components/conference/VolumeLabelPrinter.tsx`
- Mostrar no card:
  - “Área útil nominal: 90x52 mm”
  - “Área útil efetiva (compatibilidade): 82.8x47.8 mm”
- Adicionar botão “Imprimir calibração 100x60” (usa `downloadCalibrationPDF`/print calibration path).
- Adicionar texto curto: “Se o retângulo não sair inteiro, ajustar calibração da impressora”.

4) Persistir ajustes finos no banco (sem hardcode futuro)
- Tabela existente: `system_configurations`
- Chave nova: `label_print_config`
- Campos JSON: `scalePercent`, `offsetXMm`, `offsetYMm`, `swapWidthHeight`, `labelWidthMm`, `labelHeightMm`.
- Leitura no início da impressão; fallback para defaults conservadores.

5) Validar fim-a-fim (critério de aceite)
- Teste 1 volume: deve sair 1 etiqueta inteira, sem corte.
- Teste 3 volumes: cada etiqueta completa, sem “split”.
- Teste calibração: retângulo 100% visível.
- Se ainda houver corte residual: ajustar somente `offsetYMm` e `scalePercent` via config (sem mexer layout novamente).

Detalhes técnicos (curto)
- Área útil atual no código: 90x52 mm.
- Área útil efetiva proposta para máxima segurança: ~82.8x47.8 mm (com scale 92%).
- Causa provável do “duas partes”: combinação driver/QZ com mídia térmica em formato paisagem (rotaciona/interpreta página).
- Estratégia final: dupla proteção (layout encolhido + compatibilidade de impressão + calibração explícita).
