# Estética — Adugo: Território da Onça

Guia visual completo para gerar toda a arte por IA. Cada asset tem formato, tamanho, peso máximo e propriedades artísticas definidos. Quem gerar um asset deve receber este documento inteiro mais a linha do asset na seção 5.

## 1. Conceito: "riscado no chão"

A tela mostra, vista de cima, um pedaço de chão de terra batida. O tabuleiro foi riscado com um graveto e as peças são pedras, como o Adugo é jogado pelos Bororo. O jogador deve sentir que está olhando para o jogo de verdade, e não para um tabuleiro de plástico.

- **Tom:** lúdico e acolhedor. Formas arredondadas, traço levemente irregular, cores quentes. Sem personagens com rosto, sem mascotes.
- **Luz:** sol de fim de tarde vindo de cima à esquerda. Brilhos no canto superior esquerdo de cada objeto, sombras curtas para baixo e para a direita.
- **Material:** tudo parece terra, pedra, cinza, brasa ou papel. Nada de vidro, metal, neon ou degradê digital.
- **O fogo é o único elemento de cor intensa.** Laranja e vermelho não aparecem em mais nada.

### Limite cultural

A equipe não é Bororo. Por isso:

- **Não imitar grafismos Bororo** (pintura corporal, plumária, cestaria, cerâmica) em nenhum asset.
- Não desenhar pessoas indígenas.
- As rosetas pintadas na pedra da onça são uma liberdade nossa para ajudar a leitura. No jogo tradicional a onça é só uma pedra diferente das outras. A tela "Sobre" diz isso.

## 2. Paleta

Os nomes são variáveis CSS em `src/estilos/tokens.css`. Dentro dos arquivos `.svg` usa-se o valor hexadecimal direto.

| Grupo | Token | Hex | Uso |
| --- | --- | --- | --- |
| Chão | `--terra-100` | `#EBD3A8` | Brilho dos sulcos, areia solta |
| Chão | `--terra-300` | `#E0BE8E` | Cor base do chão |
| Chão | `--terra-500` | `#C99A62` | Manchas e variação do chão |
| Chão | `--terra-700` | `#6B4226` | Sulcos (linhas do tabuleiro), bordas |
| Chão | `--terra-900` | `#4A2E1A` | Texto, contornos de interface, botão principal |
| Pedra | `--pedra-300` | `#A8A39C` | Brilho dos cachorros |
| Pedra | `--pedra-500` | `#66615C` | Corpo dos cachorros |
| Pedra | `--pedra-800` | `#3F3B38` | Contorno dos cachorros |
| Onça | `--onca-300` | `#F2C057` | Brilho da onça |
| Onça | `--onca-400` | `#E8A93A` | Corpo da onça |
| Onça | `--onca-600` | `#C9780F` | Sombra própria da onça |
| Onça | `--onca-pinta` | `#3A2515` | Contorno e rosetas da onça |
| Fogo | `--brasa-300` | `#FFC145` | Miolo da chama, brasinhas do contador |
| Fogo | `--fogo-500` | `#F26B1D` | Chama |
| Fogo | `--fogo-700` | `#C1280F` | Borda da chama, faixa da carta Queimada |
| Queimado | `--carvao-900` | `#231F1D` | Ponto queimado |
| Queimado | `--carvao-700` | `#3B3532` | Base chamuscada sob o foco, rachaduras |
| Queimado | `--cinza-400` | `#9A948E` | Cinza, fumaça |
| Vida | `--mata-600` | `#4C6A2C` | Capim da toca, faixa da carta Cuidado |
| Vida | `--mata-400` | `#7FA04A` | Broto, brilho do capim |
| Papel | `--papel-100` | `#F6EBD3` | Fundo das cartas e painéis |
| Papel | `--papel-300` | `#E9D8B4` | Sombra e fibra do papel |

### Contrastes medidos

| Par | Razão | Regra que sai daí |
| --- | --- | --- |
| Texto `terra-900` sobre `papel-100` | 10,5 : 1 | Texto normal sempre assim |
| Texto `terra-900` sobre o chão | 7,0 : 1 | Texto direto no chão é permitido |
| `papel-100` sobre `fogo-700` | 5,0 : 1 | Título da carta Queimada |
| `papel-100` sobre `mata-600` | 5,2 : 1 | Título da carta Cuidado |
| `terra-900` sobre `onca-400` | 6,0 : 1 | Título da carta Onça e Bororo (texto escuro, não branco) |
| Sulco `terra-700` sobre o chão | 4,9 : 1 | Linhas legíveis no projetor |
| Corpo do cachorro sobre o chão | 3,5 : 1 | Suficiente, e o contorno `pedra-800` dá 6,3 : 1 |
| Corpo da onça sobre o chão | abaixo de 2 : 1 | **A onça tem a cor do chão. Contorno `onca-pinta` de 3 unidades é obrigatório (8,2 : 1)** |
| Chama `fogo-500` sobre o chão | abaixo de 2,5 : 1 | **O foco sempre fica sobre uma base chamuscada `carvao-700`** (chama sobre carvão: 5,4 : 1) |
| `papel-100` sobre o chão | 1,5 : 1 | Marcadores claros sempre têm contorno `terra-900` |

## 3. Tipografia

| Uso | Fonte | Peso | Tamanho |
| --- | --- | --- | --- |
| Títulos e botões | Fredoka | 600 | Título de tela `clamp(2rem, 6vmin, 4rem)`; botão `1.125rem` |
| Texto corrido e cartas | Nunito | 400 e 700 | Corpo `1.125rem`; texto de carta `clamp(1.25rem, 2.6vmin, 2.125rem)` |
| Rótulos do painel da partida | Nunito | 700 | Mínimo `0.875rem` |

- Pacotes: `@fontsource-variable/fredoka` e `@fontsource-variable/nunito`, servidos pelo próprio site para a partida funcionar sem internet depois de aberta.
- A palavra **ADUGO** da capa não usa fonte: é um desenho (seção 5, `marca/adugo.svg`).
- Nunca texto todo em maiúsculas fora do logotipo. Altura de linha 1,4 em texto corrido.

## 4. O tabuleiro (gerado por código)

O tabuleiro não é um arquivo de imagem. O componente `Tabuleiro` desenha em SVG a partir das 18 linhas de `docs/MECANICAS.md`.

| Propriedade | Valor |
| --- | --- |
| `viewBox` | `0 0 520 720` |
| Posição de um ponto | `x = 60 + 100·c`, `y = 60 + 100·r` |
| Orientação | Sempre em pé: cachorros em cima, toca embaixo |
| Tamanho na tela | `largura = min(100vw − 24px, (100dvh − altura dos painéis) × 0,722)` |
| Área de toque de cada ponto | Círculo invisível de raio 38 (no menor celular dá 46 px de diâmetro) |

**Sulcos (as linhas).** Cada linha é desenhada como três traços sobrepostos, com pontas arredondadas:

1. Fundo do sulco: `terra-700`, largura 7.
2. Sombra interna: `terra-900`, largura 3, opacidade 0,35, deslocada 1 para cima e para a esquerda.
3. Borda de terra levantada: `terra-100`, largura 2, opacidade 0,6, deslocada 3 para baixo e para a direita.

O traço não é reto. Cada trecho entre dois pontos ganha um ponto de controle no meio, deslocado de 1,5 a 3 unidades para o lado, com sorteio de semente fixa (o tabuleiro é idêntico em toda partida). O resultado deve parecer riscado à mão por alguém cuidadoso, e não tremido.

**Pontos.** Em cada cruzamento, uma covinha: círculo de raio 10 em `terra-700` com opacidade 0,55 e um arco claro `terra-100` na borda inferior direita.

**Toca.** O triângulo ganha um fundo `terra-500` com opacidade 0,25 e três tufos de capim (`chao/capim.svg`) do lado de fora das bordas. Sem palavra escrita.

**Linhas de um ponto queimado.** Os trechos de sulco que chegam a um ponto queimado ficam tracejados (6 de traço, 8 de vão) e com opacidade 0,35.

**Marcadores de jogada.**

| Marcador | Desenho |
| --- | --- |
| Peça selecionada | Peça sobe (escala 1,08, sombra maior) e ganha anel duplo: `papel-100` de 3 por dentro, `terra-900` de 2 por fora |
| Destino possível | Disco `papel-100` de raio 12 com contorno `terra-900` de 2,5 |
| Destino com captura | O mesmo disco mais um anel tracejado `terra-900` de raio 22 |
| Última jogada | Trilha `terra-900`, largura 4, opacidade 0,2, entre origem e destino |

## 5. Assets

### 5.1 Regras para todo arquivo SVG

- Um arquivo por asset, em `src/arte/`, importado como componente com `vite-plugin-svgr` (`import Onca from './pecas/onca.svg?react'`).
- `viewBox` exatamente como na tabela. Sem `width` e `height` fixos.
- Sem `<text>`, sem imagem embutida, sem fonte, sem link externo, sem `<script>`.
- Todo `id` começa com o nome do arquivo (`onca-brilho`), para não colidir quando vários SVGs estão na mesma página.
- Só cores da paleta.
- **Sem sombra projetada dentro do arquivo.** A sombra no chão é desenhada pelo tabuleiro, para poder mudar quando a peça sobe.
- Partes que animam têm `class` com o nome indicado na tabela. A animação fica no CSS, nunca dentro do SVG.
- Passar por SVGO antes de entrar no repositório.

### 5.2 Inventário

| Arquivo | Formato | `viewBox` | Tamanho no tabuleiro | Peso máx. |
| --- | --- | --- | --- | --- |
| `pecas/cachorro-a.svg`, `-b`, `-c` | SVG | `0 0 64 64` | 56 unidades | 2 KB cada |
| `pecas/onca.svg` | SVG | `0 0 80 80` | 72 unidades | 4 KB |
| `fogo/foco.svg` | SVG | `0 0 96 96` | 84 unidades | 4 KB |
| `fogo/queimado.svg` | SVG | `0 0 120 120` | 96 unidades | 4 KB |
| `fogo/fumaca.svg` | SVG | `0 0 96 96` | 84 unidades | 2 KB |
| `fogo/broto.svg` | SVG | `0 0 48 48` | 36 unidades | 1,5 KB |
| `chao/chao.svg` | SVG | `0 0 512 512` | Fundo da página, repetido | 3 KB |
| `chao/capim.svg` | SVG | `0 0 64 48` | 48 unidades | 2 KB |
| `marca/adugo.svg` | SVG | `0 0 640 200` | Capa | 8 KB |
| `capa/capa.svg` | SVG | `0 0 1200 900` | Tela inicial | 40 KB |
| `icones/*.svg` (10 ícones) | SVG | `0 0 24 24` | 24 a 32 px | 1 KB cada |
| `public/favicon.svg` | SVG | `0 0 64 64` | Aba do navegador | 2 KB |
| `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180) | PNG | — | Ícone de atalho | 40 KB cada |
| `public/og.png` | PNG | 1200 × 630 px | Prévia do link em mensagens | 300 KB |

Os PNG são exportados dos SVG por script. Nenhum é desenhado à parte.

### 5.3 Direção de arte por asset

**Cachorros (`cachorro-a/b/c.svg`).** Três seixos de rio com contornos diferentes, para os 14 não parecerem carimbados.
- Forma: mancha arredondada irregular de 6 a 8 curvas, ocupando cerca de 54 × 50 dentro do `viewBox`. Nenhum é círculo perfeito.
- Preenchimento: degradê radial com centro em 35% / 30%, de `pedra-300` para `pedra-500`.
- Contorno: `pedra-800`, largura 2.
- Detalhe: 3 a 5 pintinhas `pedra-800` com opacidade 0,3 e uma faixa de brilho curta `pedra-300` no alto à esquerda.
- No tabuleiro, cada cachorro recebe uma variante e uma rotação fixas pelo seu número, para não mudar de cara durante a partida.

**Onça (`onca.svg`).** Uma pedra maior, pintada.
- Forma: seixo ovalado irregular, cerca de 70 × 64.
- Preenchimento: degradê radial com centro em 35% / 30%, de `onca-300` para `onca-400`, com sombra própria `onca-600` na borda inferior direita.
- Contorno: `onca-pinta`, largura 3. **Obrigatório** (ver contrastes).
- Rosetas: 7 a 9, cada uma feita de 2 ou 3 arcos grossos `onca-pinta` formando um anel aberto, com miolo `onca-600`. Tamanhos variados, maiores no centro, cortadas pela borda nas laterais.
- Sem olhos, orelhas ou focinho. É uma pedra.

**Foco de calor (`foco.svg`).** O aviso de fogo. Tem de ser lido de longe, no projetor.
- Base (`class="foco-base"`): mancha chamuscada de borda irregular, raio cerca de 34, `carvao-700` com opacidade 0,85.
- Brilho (`class="foco-brilho"`): degradê radial de `brasa-300` (centro, opacidade 0,7) a transparente, raio 30.
- Chama (`class="foco-chama"`): três línguas sobrepostas, de fora para dentro `fogo-700`, `fogo-500`, `brasa-300`. Altura 44, ponta levemente inclinada para a direita. Contornos arredondados, de desenho de livro infantil.
- Contador: duas brasinhas embaixo da chama (`class="foco-brasa-1"` e `class="foco-brasa-2"`), círculos de raio 5 em `brasa-300` com contorno `carvao-900` de 1,5. Com 2 rodadas de aviso aparecem as duas; com 1, só uma.
- Leitura sem cor: forma de chama mais número de brasinhas.

**Ponto queimado (`queimado.svg`).** O que sobra.
- Mancha de borda bem irregular, cerca de 96 de diâmetro, `carvao-900`, com miolo `carvao-700`.
- 3 ou 4 rachaduras finas `cinza-400` (largura 1,5) saindo do centro.
- 8 a 12 pontinhos de cinza `cinza-400` espalhados na borda, alguns do lado de fora.
- **Nenhuma cor de fogo.** Aqui o fogo já passou.
- Leitura sem cor: mancha escura grande com rachaduras, e os sulcos que chegam nela ficam tracejados.

**Fumaça (`fumaca.svg`).** Usada ao apagar um foco. Três bolhas arredondadas `cinza-400` com opacidade 0,7, de tamanhos diferentes, cada uma com `class="fumaca-1"`, `-2`, `-3`.

**Broto (`broto.svg`).** Recompensa visual por apagar um foco. Dois folíolos `mata-400` com nervura `mata-600` e um talo curto. Aparece por 1,5 segundo sobre o ponto.

**Chão (`chao.svg`).** Ladrilho que repete sem emenda.
- Retângulo `terra-300` com dois filtros `feTurbulence` usando `stitchTiles="stitch"`: um de grão fino (`baseFrequency` 0,8, 3 oitavas, opacidade final 0,12, cor `terra-700`) e um de manchas largas (`baseFrequency` 0,015, 2 oitavas, opacidade final 0,18, cor `terra-500`).
- 10 a 15 pedrinhas e gravetos minúsculos (1 a 3 unidades) em `terra-700` com opacidade 0,3.
- Usado como `background-image` da página, com `background-size: 512px`. Por cima, uma vinheta em CSS que escurece as bordas da tela em 20%.

**Capim (`capim.svg`).** Tufo de 5 a 7 lâminas curvas, `mata-600` com duas lâminas `mata-400`. Base reta, para encostar na borda da toca.

**Logotipo (`adugo.svg`).** A palavra ADUGO riscada no chão.
- Letras de um traço só, com o mesmo tratamento de três camadas dos sulcos (seção 4), largura base 14, pontas arredondadas.
- Traço com a mesma irregularidade leve do tabuleiro. O "O" final pode ter uma pedrinha da onça ao lado.
- Letras são caminhos (`<path>`), nunca `<text>`.

**Capa (`capa.svg`).** Ilustração da tela inicial.
- Composição: chão visto de cima; um canto do tabuleiro entrando pela direita; a pedra da onça em primeiro plano à esquerda; quatro ou cinco cachorros ao fundo; um foco de calor pequeno no canto superior direito, com um fio de fumaça.
- Usa os mesmos assets (referenciados ou copiados), para a capa e o jogo terem exatamente a mesma cara.
- Deixa o terço superior esquerdo livre para o logotipo e o terço inferior livre para os botões.

**Ícones (`icones/`).** Traço de 2,25, pontas e cantos arredondados, cor `currentColor`, desenho levemente irregular (nenhum círculo perfeito).

| Arquivo | Desenho | Onde |
| --- | --- | --- |
| `pata-onca.svg` | Pegada grande e redonda, 4 dedos | Vez da onça, carta Onça e Bororo |
| `pata-cachorro.svg` | Pegada estreita com unhas | Vez dos cachorros |
| `chama.svg` | Chama de 2 línguas | Carta Queimada, medidor de território |
| `broto.svg` | Dois folíolos | Carta Cuidado |
| `regras.svg` | Livrinho aberto | Como se joga |
| `reiniciar.svg` | Seta em círculo | Jogar de novo |
| `trocar.svg` | Duas setas opostas | Trocar de lado |
| `voltar.svg` | Seta para a esquerda | Navegação |
| `fechar.svg` | X | Fechar |
| `sobre.svg` | Círculo com "i" desenhado como traço e ponto | Sobre o jogo |

## 6. Painel da partida

| Elemento | Desenho |
| --- | --- |
| Vez | Faixa `papel-100` com o ícone da pata e "Vez da onça" ou "Vez dos cachorros". Troca com um deslize de 200 ms. |
| Capturas | 5 covinhas em fila. Cada cachorro capturado aparece como uma pedrinha dentro de uma covinha. |
| Território | 5 discos de chão em fila. Cada ponto queimado transforma um disco em mini `queimado`. Rótulo: "Território". |
| Próximo foco | Texto pequeno: "Próximo foco em 3 rodadas". Some enquanto há foco ativo. |
| Rodada | Número discreto, `0.875rem`. |
| Encerrar jogada | Botão que só aparece durante uma captura em cadeia. |

## 7. Cartas

- Cartão de papel: fundo `papel-100`, borda `terra-700` de 2 px, cantos de 20 px, leve textura de fibra em `papel-300`.
- Largura `min(92vw, 560px)`. Fundo da tela escurecido com `carvao-900` a 55%.
- Faixa superior de 56 px com ícone e nome do tipo:

| Tipo | Cor da faixa | Cor do texto da faixa | Ícone |
| --- | --- | --- | --- |
| Queimada | `fogo-700` | `papel-100` | `chama` |
| Cuidado | `mata-600` | `papel-100` | `broto` |
| Onça e Bororo | `onca-400` | `terra-900` | `pata-onca` |

- Texto: Nunito 700, tamanho de carta (seção 3), alinhado à esquerda, no máximo 220 caracteres.
- Fonte da informação: linha em itálico, `0.875rem`, no pé do cartão.
- Botão "Continuar": largura total, altura mínima 56 px.
- Entrada: sobe 24 px e gira de −2° para 0° em 250 ms.

## 8. Botões e painéis

| Elemento | Especificação |
| --- | --- |
| Botão principal | Fundo `terra-900`, texto `papel-100`, Fredoka 600, altura mínima 56 px, cantos 16 px. Pressionado: desce 2 px. |
| Botão secundário | Fundo `papel-100`, borda `terra-700` de 2 px, texto `terra-900`. |
| Painel | Fundo `papel-100`, cantos 20 px, sombra `0 4px 0 rgba(74,46,26,0.25)` (sombra dura, de papel recortado). |
| Foco de teclado | Contorno `terra-900` de 3 px com afastamento de 3 px, em todo elemento clicável. |

## 9. Movimento

| Evento | Animação | Duração |
| --- | --- | --- |
| Peça anda | Desliza em linha reta, com leve subida no meio | 220 ms, saída suave |
| Onça pula | Arco: sobe até escala 1,15 e desce | 320 ms |
| Cachorro capturado | Encolhe e some, com três grãos de poeira `terra-500` | 300 ms |
| Foco nasce | Base aparece, chama cresce de 0 a 100% | 400 ms |
| Foco com aviso 2 | Chama oscila (escala vertical 0,94 a 1,06) e brilho pulsa | Ciclo de 1,2 s |
| Foco com aviso 1 | Chama 20% maior, oscila mais rápido; uma brasinha some | Ciclo de 0,7 s |
| Foco apagado | Chama encolhe, `fumaca` sobe e some, `broto` aparece e some | 500 ms + 1,5 s |
| Ponto queima | Chama cresce até 160%, clarão `brasa-300`, `queimado` surge por baixo, sulcos vizinhos viram tracejados | 700 ms |
| Território destruído | Tela escurece para `carvao-900` a 60% de fora para dentro | 900 ms |

Com `prefers-reduced-motion`, tudo vira troca de opacidade de 150 ms e a chama fica parada.

## 10. Telas

Seis telas. O fundo é sempre o chão.

1. **Início:** logotipo, subtítulo "Território da Onça", capa, e quatro botões: "Jogar com o fogo" (principal), "Adugo clássico", "Como se joga", "Sobre o jogo e o povo Bororo".
2. **Como se joga:** quatro passos, cada um com um mini tabuleiro animado feito com os componentes reais: andar, capturar, cercar, apagar o fogo.
3. **Partida.**
4. **Carta** (por cima da partida).
5. **Fim:** título do resultado, números da partida, três perguntas da roda de conversa, cartas da partida, botões.
6. **Sobre:** o Adugo e o povo Bororo, o que é liberdade nossa, fontes, equipe e disciplina.

Disposição da partida:

```
Celular em pé                    Projetor ou computador

┌───────────────────┐            ┌────────┬──────────────┬────────┐
│ Vez · Território  │            │ Onça   │              │ Cães   │
├───────────────────┤            │ Captu- │              │ Vez    │
│                   │            │ ras    │  tabuleiro   │        │
│     tabuleiro     │            │        │  (altura     │ Terri- │
│                   │            │ Vez    │   total)     │ tório  │
│                   │            │        │              │ Próx.  │
├───────────────────┤            │        │              │ foco   │
│ Capturas · Rodada │            └────────┴──────────────┴────────┘
└───────────────────┘
```

- Em pé (largura menor que 800 px): painéis de 56 px em cima e 64 px embaixo.
- Deitado: tabuleiro com a altura inteira da tela e painéis laterais de 220 a 320 px.
- No projetor, nenhum texto de jogo fica abaixo de 20 px.

## 11. Leitura sem depender de cor

| Estado | Sinal além da cor |
| --- | --- |
| Foco de calor | Forma de chama e brasinhas contando |
| Ponto queimado | Mancha com rachaduras e sulcos tracejados |
| Onça | Pedra maior, com rosetas |
| De quem é a vez | Ícone da pata e texto |
| Destino possível | Disco com contorno |

Cada ponto do tabuleiro tem descrição para leitor de tela ("Fileira 3, coluna 2: foco de calor, queima em 2 rodadas").

## 12. Opcional: imagens geradas por IA de imagem

O jogo fica completo só com os SVG acima. Se sobrar tempo, estes dois arquivos podem substituir os equivalentes em SVG.

| Arquivo | Formato | Tamanho | Peso máx. | Substitui |
| --- | --- | --- | --- | --- |
| `public/tex/chao-1024.webp` | WebP, qualidade 80 | 1024 × 1024 px, repetível | 180 KB | `chao/chao.svg` |
| `public/capa-1600.webp` | WebP, qualidade 82 | 1600 × 1200 px | 250 KB | `capa/capa.svg` |

Prompt do chão:

```
Seamless tileable texture, top-down orthographic view of packed dry earth
in a village courtyard, warm ochre sand color (#E0BE8E), fine grain, a few
tiny pebbles and twigs, soft late-afternoon light from the top left, very
low contrast, flat, no shadows of objects, no plants, no footprints, no
text, no patterns or drawings. Painterly children's-book illustration
style, not photographic.
```

Prompt da capa:

```
Top-down children's-book illustration of a traditional board game scratched
with a stick into packed ochre earth: straight grooved lines forming a grid
with diagonals, entering from the right side of the image. In the foreground
left, one large rounded river stone painted amber-yellow with dark jaguar
rosettes. In the background, five plain grey river pebbles on the grid
points. Top right corner: a small flame with a thin wisp of smoke on a
scorched patch. Warm late-afternoon light from the top left, short soft
shadows. Upper-left third and lower third left empty for a title and
buttons. No people, no hands, no faces on the stones, no text, no
indigenous graphic patterns or body paint motifs. Palette: ochre, brown,
grey stone, amber, one small accent of orange fire.
```

Depois de gerar, conferir: a cor média do chão está perto de `#E0BE8E`? O ladrilho repete sem emenda visível? Há algum grafismo indígena, pessoa ou texto? Se sim, gerar de novo.

## 13. Como gerar e aprovar cada asset

1. Entregar à IA este documento e o nome do asset.
2. A IA devolve um arquivo `.svg` que segue a seção 5.1.
3. Colocar o arquivo em `src/arte/` e abrir a **prancha** (`/prancha` no modo de desenvolvimento): uma página que mostra todos os assets sobre o chão, no tamanho de celular e no dobro.
4. Olhar a prancha renderizada, e não o código. Aprovar só se:
   - lê-se de relance no tamanho de celular (cachorro com 34 px, onça com 43 px);
   - a onça se destaca dos cachorros e do chão;
   - o foco é a coisa mais chamativa da tela, e o ponto queimado a mais escura;
   - a luz vem de cima à esquerda em todos os assets;
   - só há cores da paleta e nenhuma cor de fogo fora do fogo;
   - o peso está dentro do limite.
5. Se algo falhar, pedir a correção apontando o item da lista.

A prancha é o primeiro entregável da arte: ela mostra a direção inteira antes de qualquer tela ser montada.
