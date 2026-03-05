
Objetivo
- Corrigir definitivamente o avanço excessivo (“metros de etiqueta”) e garantir 1 etiqueta física de 100x60mm por volume, mantendo impressão escura no modo DPL.

Diagnóstico fechado (causa raiz)
- O DPL está em modo métrico (`STX m`), mas as linhas dos campos estão 10x acima do tamanho da etiqueta:
  - `0800`, `1400`, `2000` (mm/10) = 80mm, 140mm, 200mm.
- Com etiqueta de 60mm, isso força avanço longo para posicionar texto fora da área.
- O `STX O0220` ainda desloca o início de impressão (+22mm), agravando o problema.

Plano de correção (implementação)
1) Normalizar coordenadas para caberem em 60mm
- Arquivo: `src/components/conference/qzTrayPrinter.ts`
- Reescrever os records de texto para linhas dentro de `0000..0600` (mm/10), preservando colunas.
- Exemplo de ajuste:
  - `...0800...` -> `...0080...`
  - `...1400...` -> `...0140...`
  - `...2000...` -> `...0200...`
- Ajustar também `printTestLabel` (`1000` -> `0100`).

2) Remover deslocamento que cria avanço indevido
- Remover `STX O0220` do setup (ou zerar explicitamente com `STX O0000`).
- Manter `STX m`, `STX e`, `STX c0000` e `STX M` com valor de segurança para TOF (sem exagero de avanço).

3) Estruturar envio DPL em bloco estável
- Enviar comandos de sistema uma vez por lote e, para cada etiqueta, apenas:
  `STX L -> header/records -> Q0001 -> E`
- Evitar reconfiguração desnecessária por etiqueta (reduz efeitos colaterais de feed).

4) Adicionar proteção anti-regressão
- Criar validação interna antes de imprimir:
  - Se qualquer linha de campo passar de 0600 (60mm), abortar impressão e retornar erro claro.
- Isso impede voltar ao cenário de “metros de etiqueta” em mudanças futuras.

5) Ajustar feedback de erro para operação
- Se validação falhar, mostrar mensagem objetiva no UI:
  “Layout inválido para etiqueta 60mm; impressão bloqueada para evitar desperdício.”

Arquivos impactados
- `src/components/conference/qzTrayPrinter.ts` (principal)
- (Opcional, apenas mensagem) `src/components/conference/VolumeLabelPrinter.tsx`

Detalhes técnicos (resumo)
```text
SETUP (1x por lote):
STX m
STX c0000
STX e
STX Mxxxx
[sem O0220]

PARA CADA ETIQUETA:
STX L
D11
H30
P0
S0
records de texto com row <= 0600
Q0001
E
```

Validação obrigatória (física)
1. Imprimir 1 etiqueta:
- Deve sair 1 única etiqueta com todo conteúdo dentro do layout.
- Consumo aproximado: 60mm (sem avanço longo).

2. Imprimir 3 volumes:
- Devem sair exatamente 3 etiquetas (1/3, 2/3, 3/3), sem “pulos” grandes entre elas.

3. Teste de segurança:
- Forçar coordenada inválida (temporário em dev) e confirmar bloqueio com erro amigável (sem imprimir metros).
