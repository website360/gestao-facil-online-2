

## Corrigir Impressao de Etiquetas DPL na Datamax (Saindo em Branco)

### Problema Identificado

A etiqueta sai em branco porque o formato dos registros de texto DPL esta incorreto. O codigo atual usa o formato:

`1<font><rotation><RRRR><CCCCC><data>`

Mas o formato correto do DPL exige dois campos adicionais (multiplicadores de altura e largura):

`1<font><rotation><height_mult><width_mult><RRRR><CCCCC><data>`

Sem esses campos, a impressora interpreta os dados errados, posiciona o texto em coordenadas invalidas e/ou renderiza com tamanho zero.

Alem disso, o exemplo oficial do QZ Tray envia os dados como um **array de strings separadas** (uma por linha), enquanto nosso codigo concatena tudo em uma unica string.

### Solucao

**Arquivo:** `src/components/conference/qzTrayPrinter.ts`

#### 1. Corrigir o formato dos registros de texto DPL

Todos os registros de texto precisam incluir os multiplicadores de altura e largura (valor `1` para tamanho normal). Exemplo:

- Antes: `'141' + '0020' + '00193'` (11 chars, falta multiplicadores)
- Depois: `'14111' + '0020' + '00193'` (13 chars, com height=1, width=1)

Isso sera aplicado em todos os registros de texto da funcao `generateDPLLabel`:
- Header "IRMAOS MANTOVANI TEXTIL"
- Label "CLIENTE"
- Nome do cliente
- Label "NOTA FISCAL"
- Valor NF
- Label "VOLUME"
- Valor volume
- Label "DATA"
- Valor data

#### 2. Enviar dados como array de strings

Alterar a funcao `printRawDPL` para enviar cada linha DPL como um elemento separado do array, seguindo o padrao oficial do QZ Tray:

```text
// De:
await qz.print(config, [dplCommands]);  // uma string gigante

// Para:
await qz.print(config, dplCommands);    // array de strings, uma por linha
```

E alterar `generateDPLLabel` para retornar um `string[]` em vez de `string`.

#### 3. Adicionar botao de teste de impressao simples

Na interface `VolumeLabelPrinter`, quando o QZ Tray esta conectado, adicionar um botao "Teste Rapido" que envia a etiqueta minima oficial do QZ Tray (apenas "TEST 1 2 3") para validar que a comunicacao com a impressora funciona.

#### 4. Adicionar quantidade (Q0001)

Incluir o comando `Q0001` antes do `E` (fim de label), conforme o exemplo oficial. Esse comando define a quantidade de copias a imprimir.

### Detalhes Tecnicos

Formato correto para registros de texto DPL (bitmap fonts 0-8):

```text
1<font><rotation><height_mult><width_mult><RRRR><CCCCC><data>
|  |      |          |           |         |       |       |
|  |      |          |           |       4 dig   5 dig   texto
|  |      |        1 dig       1 dig
|  |    1 dig (1=0, 2=90CW, 3=180, 4=90CCW)
|  1 dig (0-8 bitmap)
record type = 1
```

Os multiplicadores `1` significam tamanho normal (1x). Valores de `2` a `9` ampliam.

Exemplo oficial funcional do QZ Tray:
```text
\x02L
D11
H14
121100000300015TEST 1 2 3
Q0001
E
```

### Arquivos Modificados

1. `src/components/conference/qzTrayPrinter.ts` -- corrigir formato DPL e envio como array
2. `src/components/conference/VolumeLabelPrinter.tsx` -- adicionar botao de teste

