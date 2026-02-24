
Objetivo aprovado para implementação: eliminar o caminho de impressão via navegador (que abre diálogo do Windows e pode bloquear no Edge) e trocar para envio direto à Datamax sem diálogo, mantendo o layout da etiqueta exatamente no padrão atual de referência (bordas finas e estilo simples).

Resumo do diagnóstico (causa do problema)
- Hoje o botão “Imprimir” chama `printLabelsDirectly()` em `directPrinter.ts`, que usa `window.open + window.print`.
- Esse caminho SEMPRE depende do diálogo de impressão do sistema operacional e é suscetível a bloqueios do Edge (`ERR_BLOCKED_BY_CLIENT`), além de pop-up blocker.
- Já existe integração com QZ Tray (`qzTrayPrinter.ts`) no projeto, mas ela não está conectada ao fluxo da tela.
- Portanto, o comportamento atual não atende “enviar direto para impressora” de forma confiável.

Solução definitiva proposta
1) Tornar o QZ Tray o caminho principal do botão “Imprimir” (sem diálogo do Windows).
2) Usar o PDF já gerado no layout correto como fonte única de render (para ficar idêntico ao modelo de referência).
3) Enviar esse PDF para a Datamax via QZ em modo `pixel/pdf` (base64), que imprime direto na fila da impressora selecionada.
4) Manter fallback apenas quando QZ não estiver disponível (download de PDF), com mensagem clara.

Arquitetura do fluxo final
```text
VolumeLabelPrinter
  -> gerar PDF (layout de referência já existente)
  -> tentar conexão QZ Tray
  -> localizar Datamax (ou usar impressora salva)
  -> enviar PDF base64 via qz.print (sem diálogo Windows)
  -> sucesso: toast + onPrint()
  -> falha: mensagem técnica + fallback PDF
```

Mudanças planejadas por arquivo

1) `src/components/conference/VolumeLabelPrinter.tsx`
- Substituir o handler do botão principal para fluxo assíncrono via QZ (não `window.print`).
- Adicionar estado de conexão/impressão para evitar clique duplo e “travar fila”.
- Mensagens de erro orientadas:
  - QZ não instalado/rodando
  - Impressora Datamax não encontrada
  - Falha no job QZ
- Preservar botão “Baixar PDF” como contingência.

2) `src/components/conference/qzTrayPrinter.ts`
- Adicionar função de alto nível para imprimir PDF base64 diretamente:
  - conectar QZ
  - escolher impressora (Datamax preferencial)
  - criar config de impressão
  - chamar `qz.print` com `type: 'pixel', format: 'pdf', flavor: 'base64'`
- Manter funções raw DPL existentes, mas não usar como caminho padrão (evita travamento por comando DPL incompatível com driver/configuração local).
- Melhorar tratamento de erro retornando mensagens acionáveis para UI.

3) `src/components/conference/pdfLabelGenerator.ts`
- Adicionar utilitário para obter o PDF em base64 (sem download), reutilizando exatamente o gerador atual.
- Não alterar layout visual (mantém padrão já aprovado: bordas finas e estilo simples).

4) `src/components/conference/directPrinter.ts`
- Retirar do caminho principal de impressão (pode ficar legado/fallback técnico, mas sem ser botão principal).
- Objetivo: evitar que o usuário caia novamente em `window.print`.

Detalhes técnicos (seção técnica)
- Motivo técnico central: browser não permite “silent print” confiável em `window.print`; para direto de verdade precisa ponte nativa (QZ Tray).
- Estratégia de fidelidade visual: imprimir o PDF vetorial já padronizado, em vez de reconstruir layout em DPL/HTML.
- Ordem de prioridade:
  1. QZ + Datamax detectada
  2. QZ + impressora selecionada/salva
  3. fallback PDF manual

Proteções contra novos travamentos
- Debounce/lock do botão durante job ativo.
- Timeout controlado e captura de exceções do QZ.
- Não concatenar comandos raw DPL no fluxo principal (ponto comum de lock em Datamax quando firmware/driver diverge).

Critérios de aceite
- Clicar “Imprimir etiquetas” não abre diálogo do Windows.
- Job vai direto para a Datamax quando QZ estiver ativo.
- Etiqueta sai com layout igual ao PDF de referência (mesmo padrão visual).
- Em caso de ausência/falha do QZ, usuário recebe instrução clara e PDF de fallback sem quebrar o fluxo.

Plano de validação (E2E)
1. Fluxo de conferência completo até tela de etiquetas.
2. Testar 1 volume e múltiplos volumes.
3. Validar reimpressão em `ReprintLabelsModal`.
4. Confirmar ausência do diálogo de impressão do Windows.
5. Confirmar formato físico (100x60), bordas finas e campos (CLIENTE, NOTA FISCAL, VOLUME, DATA).
6. Testar cenário de falha (QZ desligado) e verificar fallback para PDF.

Risco e mitigação
- Risco: ambiente sem QZ Tray instalado ou não autorizado.
- Mitigação: fallback automático para PDF + instrução objetiva de habilitação do QZ para modo direto.
