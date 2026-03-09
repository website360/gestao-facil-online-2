

## Problema

O código DPL atual tem problemas graves de formatação que causam o desperdício de papel e layout quebrado:

1. **Cada comando de sistema (`\x02M`, `\x02O`, `\x02D`, `\x02H`, `\x02S`) está sendo tratado como uma label separada** — a impressora interpreta cada `\x02` como início de novo label, fazendo avançar papel a cada comando.
2. **O comprimento da label (`M0500`) está em dots (500 dots ≈ 62mm), mas os comandos de posicionamento de texto usam valores muito altos** (row 200 = 200 dots ≈ 25mm, o que está OK, mas a combinação com os múltiplos inícios de label causa o avanço excessivo).
3. **Os comandos de configuração (D, H, S) devem ser enviados ANTES do `\x02L` (início do formato) e idealmente como comandos de sistema separados, não misturados com STX repetidos.**

## Solução

Reescrever `generateDPLLabel` com a estrutura DPL correta para E-Class Mark III:

```text
STX n          ← limpa buffer (uma vez)
STX KcRFF      ← set continuous media (ou gap mode)
STX c           ← set metric mode  
STX M0480      ← label length 480 dots (60mm × 8 dots/mm)
STX D15        ← darkness
STX S0         ← speed
STX L          ← START label format (tudo entre L e E é UMA etiqueta)
D11            ← density dentro do formato
191100020000050IRMAOS MANTOVANI TEXTIL
121100080000010CLIENTE:
121100080000150[nome]
121100140000010NF:
121100140000080[nf]
121100200000010VOLUME:
121100200000150[vol]
121100200000350DATA:
121100200000450[data]
E              ← fim e imprime
```

Pontos-chave da correção:
- **Todos os comandos de configuração (D, H, S, M) ficam ANTES do `\x02L`**, cada um com seu próprio `\x02`
- **Entre `\x02L` e `E` ficam APENAS os comandos de texto/gráfico** — sem `\x02` no meio
- **Remover `\x02H30`** — o comando H não existe no DPL padrão do E-Class; a densidade é controlada apenas por D e opcionalmente pelo comando `D11` (set dot density) dentro do formato
- **Ajustar `M` para 480 dots** (60mm × 8 dots/mm) para corresponder exatamente ao tamanho da etiqueta
- **Remover `Q0001\r` de dentro do bloco** — no DPL do E-Class, `E` já finaliza e imprime 1 cópia; `Q` deve vir antes de `E` se necessário

## Arquivo impactado

- `src/components/conference/qzTrayPrinter.ts` — reescrever apenas a função `generateDPLLabel`

## Validação

- Deve imprimir **uma única etiqueta de ~60mm** com todas as informações no mesmo label
- Layout compacto sem avanço excessivo de papel
- Texto escuro (D15 mantido)

