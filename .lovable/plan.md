
Objetivo
- Fazer a etiqueta sair mais escura na Datamax (como no BarTender) sem engrossar linhas/layout.

Diagnóstico rápido
- Hoje o fluxo principal imprime em `pixel/pdf` via QZ (`printPdfDirect`), que depende do raster/driver e pode sair “lavado”.
- Já existe suporte nativo DPL no projeto com comandos de escurecimento máximos (`D15`, `H30`, `S0`), mas ele não está sendo usado no botão principal.
- Para Datamax, o caminho mais confiável para escurecer é RAW DPL (linguagem nativa da impressora), não PDF rasterizado.

Plano de implementação
1) Priorizar impressão nativa Datamax (RAW DPL)
- Em `src/components/conference/qzTrayPrinter.ts`:
  - Criar/ajustar uma função de alto nível que:
    - conecta no QZ com timeout,
    - seleciona impressora Datamax/Honeywell física (mantendo filtro de impressoras virtuais),
    - gera DPL com os comandos de densidade/heat já existentes,
    - envia via `qz.print` em modo `raw`.
  - Centralizar parâmetros térmicos em constantes (ex.: `DARKNESS=15`, `HEAT=30`, `SPEED=0`) para ajuste fino sem mexer no layout.

2) Trocar o fluxo principal de impressão de etiquetas para DPL
- Em `src/components/conference/pdfLabelGenerator.ts`:
  - `printVolumeLabelsDirect(...)` passa a chamar primeiro a nova função RAW DPL (usando os dados de cliente/NF/volume).
  - PDF continua para download e fallback controlado.

3) Fallback controlado (sem regredir para “claro” sem aviso)
- Estratégia:
  - Se Datamax está disponível: tentar DPL; se falhar, retornar erro claro (“falha no modo Datamax nativo”) em vez de imprimir automaticamente em PDF claro.
  - Se Datamax não for encontrada: manter comportamento atual de mensagem/fallback (download PDF).

4) Feedback de UI
- Em `VolumeLabelPrinter.tsx`:
  - Ajustar mensagens de sucesso/erro para deixar explícito quando foi “modo Datamax nativo (escuro)”.
  - Manter botões e UX atuais (sem novas telas).

Fluxo final (resumo)
```text
Clique "Imprimir"
   -> QZ conecta
   -> Detecta Datamax física
      -> Sim: envia RAW DPL (D15/H30/S0)  => saída mais escura
      -> Não: informa ausência Datamax e mantém alternativa PDF
```

Arquivos impactados
- `src/components/conference/qzTrayPrinter.ts` (principal)
- `src/components/conference/pdfLabelGenerator.ts` (roteamento do fluxo)
- `src/components/conference/VolumeLabelPrinter.tsx` (mensagens de status)

Critérios de aceite
- Etiqueta sai visivelmente mais escura (comparável ao padrão BarTender) sem aumentar espessura de linhas no layout.
- Orientação permanece correta (já ajustada anteriormente).
- Funciona tanto em:
  - Conferência final (`VolumeWeightModal`)
  - Reimpressão (`ReprintLabelsModal`)
- Quando Datamax não estiver disponível, sistema não “finge sucesso”.

Validação ponta a ponta
- Testar 1 etiqueta real na Datamax com mesmo pedido que estava saindo claro.
- Testar múltiplos volumes (ex.: 1/3, 2/3, 3/3).
- Testar caminho de erro (QZ desligado / impressora desconectada).
