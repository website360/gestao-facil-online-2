

## Corrigir Impressao DPL - Usando Exemplo Oficial do QZ Tray

### Problema Real Identificado

Comparando nosso codigo com o **exemplo oficial do QZ Tray** (https://github.com/qzind/tray/wiki/Raw#dpl-text), existem duas diferencas criticas:

**1. Terminador de linha errado**: O exemplo oficial usa `\n` (LF). Nosso codigo usa `\x0D` (CR).

Exemplo oficial funcional:
```text
'\x02L\n',
'D11\n',
'H14\n',
'121100000300015TEST 1 2 3 4 5 6 7 8 9 10\n',
'Q0001\n',
'E\n'
```

Nosso codigo atual:
```text
'\x02L' + '\x0D',
'D11' + '\x0D',
...
```

**2. Comandos de desenho de linhas/caixas (1X) potencialmente malformados**: O label completo usa dezenas de comandos `1X1100...` para bordas e caixas. Se algum desses comandos estiver com formato invalido, a impressora pode entrar em estado de erro e produzir etiqueta em branco. O exemplo oficial nao usa esses comandos.

### Solucao em Duas Etapas

**Arquivo:** `src/components/conference/qzTrayPrinter.ts`

#### Etapa 1: Corrigir o teste rapido para ser IDENTICO ao exemplo oficial

O botao "Teste Rapido" deve enviar exatamente o mesmo payload do exemplo oficial do QZ Tray, sem nenhuma modificacao:

```text
'\x02L\n',
'D11\n',
'H14\n',
'121100000300015TEST 1 2 3 4 5 6 7 8 9 10\n',
'Q0001\n',
'E\n'
```

Isso vai validar se a comunicacao com a impressora funciona. Se o teste imprimir, sabemos que o problema esta nos comandos complexos do label. Se nao imprimir, o problema e de configuracao/driver.

#### Etapa 2: Corrigir o label completo

Trocar o terminador de `\x0D` para `\n` em toda a funcao `generateDPLLabel`. Simplificar o label removendo os comandos de desenho de caixas/bordas (`1X1100...`) que podem estar malformados, mantendo apenas os textos essenciais (cliente, NF, volume, data) ate confirmar que a impressao basica funciona.

### Detalhes Tecnicos

Mudancas especificas no `qzTrayPrinter.ts`:

1. Na funcao `printTestLabel`: substituir todo o array `testLines` pelo exemplo oficial exato do QZ Tray wiki, usando `\n` como terminador
2. Na funcao `generateDPLLabel`: trocar `const CR = '\x0D'` por `const CR = '\n'`
3. Remover temporariamente todos os comandos `1X1100...` (linhas de borda/caixa) do label completo, mantendo apenas comandos de texto, para isolar o problema
4. Manter os comandos de configuracao basicos (`D11`, `H15`, `S2`, etc.) que nao devem causar problema

### Arquivos Modificados

1. `src/components/conference/qzTrayPrinter.ts` -- corrigir terminadores e simplificar label

