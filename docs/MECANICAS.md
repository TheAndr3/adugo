# Mecânicas — Adugo: Território da Onça

Especificação das regras para quem for implementar o motor do jogo. Tudo aqui é decisão fechada, exceto o que está marcado como **a validar em teste**. Os números ajustáveis ficam em um único objeto de configuração (seção 9).

Dois modos:

- **Clássico:** só as regras tradicionais (seções 1 a 4). Sem fogo e sem cartas.
- **Território da Onça:** regras tradicionais + fogo (seção 5) + cartas (seção 7).

## 1. Tabuleiro

31 pontos: uma grade 5 × 5 (25 pontos) mais a **toca**, um triângulo de 6 pontos preso ao meio de um dos lados.

Cada ponto tem coordenada `(r, c)`: `r` é a fileira (0 a 6, de cima para baixo) e `c` é a coluna (0 a 4). Na tela, `x` cresce com `c` e `y` cresce com `r`.

```
        c0  c1  c2  c3  c4
r0      o---o---o---o---o        cachorros começam em r0, r1
        | \ | / | \ | / |        e em r2 (menos o centro)
r1      o---o---o---o---o
        | / | \ | / | \ |
r2      o---o---o---o---o        (2,2) = onça
        | \ | / | \ | / |
r3      o---o---o---o---o
        | / | \ | / | \ |
r4      o---o---o---o---o        (4,2) = boca da toca
              / | \
r5          o---o---o            toca: (5,1) (5,2) (5,3)
          /     |     \
r6      o-------o-------o        toca: (6,0) (6,2) (6,4)
```

O tabuleiro é definido por **18 linhas retas**. Vizinhança e pulos saem delas, sem nenhuma tabela escrita à mão:

| Grupo | Linhas |
| --- | --- |
| Fileiras da grade (5) | `(r,0) … (r,4)` para `r` de 0 a 4 |
| Colunas laterais (4) | `(0,c) … (4,c)` para `c` em 0, 1, 3, 4 |
| Coluna central (1) | `(0,2) (1,2) (2,2) (3,2) (4,2) (5,2) (6,2)` |
| Diagonais grandes (2) | `(0,0) (1,1) (2,2) (3,3) (4,4)` e `(0,4) (1,3) (2,2) (3,1) (4,0)` |
| Diagonais curtas de cima (2) | `(0,2) (1,1) (2,0)` e `(0,2) (1,3) (2,4)` |
| Diagonais que viram lado da toca (2) | `(2,0) (3,1) (4,2) (5,3) (6,4)` e `(2,4) (3,3) (4,2) (5,1) (6,0)` |
| Fileiras da toca (2) | `(5,1) (5,2) (5,3)` e `(6,0) (6,2) (6,4)` |

- **Vizinhos:** dois pontos seguidos em uma linha.
- **Pulo:** três pontos seguidos em uma linha (origem, ponto pulado, pouso).

Invariantes para os testes do motor: 31 pontos, 66 ligações, 48 trincas de pulo (96 pulos com direção). Grau de `(2,2)` e de `(4,2)` é 8; grau de `(0,0)` é 3; grau de `(6,0)` é 2.

Consequência da geometria: a onça em `(3,3)` pode pular um cachorro em `(4,2)` e cair em `(5,1)`, dentro da toca, porque os três pontos estão na mesma linha.

## 2. Peças e posição inicial

- **1 onça** em `(2,2)`.
- **14 cachorros** em todos os pontos de `r0` e `r1` (10) e em `(2,0) (2,1) (2,3) (2,4)` (4).
- As fileiras `r3`, `r4` e a toca começam vazias.

Fonte da posição: a onça no centro e os cachorros na metade oposta à toca ([Wikipedia, Adugo](https://en.wikipedia.org/wiki/Adugo)). O relatório ainda precisa de uma fonte publicada em português.

## 3. Rodada, movimento e captura

**Uma rodada é uma jogada da onça seguida de uma jogada dos cachorros.** A onça sempre joga primeiro.

- **Movimento:** a peça anda para um ponto vizinho vazio. Os cachorros podem andar em qualquer direção. Não é permitido passar a vez.
- **Captura:** só a onça captura. Ela pula um cachorro vizinho e cai no ponto logo depois, na mesma linha, se ele estiver vazio. O cachorro pulado sai do jogo.
- **Captura em cadeia:** depois de um pulo, se houver outro pulo possível a partir do novo ponto, a onça pode continuar na mesma jogada. Ela pode parar quando quiser (botão "Encerrar jogada").
- **Captura não é obrigatória.**

A captura em cadeia vem da proposta original e das descrições brasileiras do jogo; a página da Wikipedia não a menciona. Mantemos.

## 4. Fim da partida no modo clássico

| Resultado | Condição | Quando se verifica |
| --- | --- | --- |
| **Onça vence** | Capturou 5 cachorros | Logo depois de cada pulo (interrompe a cadeia) |
| **Cachorros vencem** | A onça não tem nenhum movimento nem pulo possível | Logo depois da jogada dos cachorros |
| **Empate: os dois perdem** | A mesma posição se repete 3 vezes com a mesma peça a jogar, **ou** a partida chega a 100 rodadas, **ou** os cachorros não têm jogada possível | Fim de cada jogada |

O empate conta como derrota dos dois lados, nos dois modos.

## 5. O fogo (modo Território da Onça)

O fogo é um terceiro elemento que nenhum jogador controla. Ele tem três estados por ponto: **foco de calor** (aviso), **apagado** (volta a ser ponto normal) e **queimado** (fechado até o fim).

### 5.1 Regras

1. **Só existe um foco por vez.**
2. **Quando nasce:** no início das rodadas 4, 8, 12, 16 e 20, e depois a cada 3 rodadas a partir da 24 (24, 27, 30, 33…). As três primeiras rodadas não têm fogo.
3. **Onde nasce:** em um ponto que cumpra tudo isto:
   - está vazio e não está queimado;
   - **não fica na toca** (os 6 pontos do triângulo nunca recebem foco; a boca `(4,2)` pode receber);
   - **alguma peça consegue chegar nele em até 2 jogadas** andando por pontos livres, com o tabuleiro como está naquele momento.

   Entre os pontos que cumprem isso, o sorteio é ponderado: peso 1, **+1 se o ponto fica na borda** da grade, **+2 se é vizinho de um ponto já queimado**. Se nenhum ponto cumprir as condições, aquele foco não nasce.
4. **Aviso de 2 rodadas:** o foco que nasce no início da rodada N queima no fim da rodada N+1. Os dois lados têm duas jogadas cada para chegar nele. A tela mostra o contador (2, depois 1).
5. **Apagar:** qualquer peça que **parar** no ponto do foco apaga o fogo. É uma jogada normal e a peça fica ali. Vale para os cachorros e para a onça, inclusive quando ela cai no foco no fim de um pulo de captura.
6. **Queimar:** se o aviso acabar sem ninguém no ponto, ele vira **ponto queimado**. Nenhuma peça entra nele e a onça não pode usá-lo como pouso de pulo. Fica assim até o fim.
7. **Território destruído:** com **5 pontos queimados**, a partida acaba e **os dois jogadores perdem**.
8. **Cerco com fogo:** os cachorros só vencem se cercarem a onça sozinhos. Se a onça ficar sem jogada e algum ponto queimado estiver fechando uma saída ou um pouso dela, **ninguém vence**.

   Teste exato para o motor: recalcular as jogadas da onça tratando os pontos queimados como vazios. Se existir alguma jogada, o fogo participou do cerco.

### 5.2 Ordem de resolução da rodada N

1. Se N é rodada de foco e não há foco ativo, nasce um foco com aviso 2.
2. A onça joga. Se chegou a 5 capturas, **a onça vence**.
3. Os cachorros jogam. Se a onça ficou sem jogada: cerco limpo, **os cachorros vencem**; cerco com fogo, **ninguém vence**.
4. Fim da rodada: o aviso do foco ativo diminui 1. Se chegou a 0, o ponto queima.
   - Se agora são 5 queimados, **território destruído**.
   - Se a queima tirou a última saída da onça, **cerco com fogo**.
5. Verificações de empate.

A vitória é sempre verificada antes do fogo. Se a 5ª captura ou o cerco acontecem na mesma rodada em que o 5º ponto queimaria, **a vitória vale**.

### 5.3 Por que o fogo pesa para os dois lados, e mais para os cachorros

Sem ajuste, ponto queimado favorece os cachorros: tira mobilidade e pousos da onça e serve de parede para o cerco. Três regras invertem isso:

| Regra | Efeito |
| --- | --- |
| Cerco com fogo não dá vitória (5.1, item 8) | O ponto queimado deixa de ser parede útil. Perto dele a onça não pode ser vencida, então cada queimada cria uma zona onde os cachorros não conseguem fechar o jogo. |
| Os cachorros jogam por último na rodada | A última chance de apagar é sempre deles. Com 14 peças espalhadas, quase sempre é um cachorro que está perto do foco, e sair da formação abre brecha para pulo. |
| Derrota coletiva com 5 queimados | Nenhum lado pode usar o fogo como estratégia até o fim. |

O que o fogo custa à onça: menos caminhos, menos pousos para capturar e o risco de ficar presa pelo próprio território queimado. Ela também não pode se esconder ao lado de um ponto queimado para sempre, porque o relógio do fogo derrota os dois.

**A validar em teste:** um cachorro com ponto queimado logo atrás não pode ser pulado naquela direção. É uma proteção pequena que sobra para os cachorros. Se pesar demais nas partidas reais, a correção é permitir que a onça capture nessa situação "empurrando" o cachorro para fora (sem pulo).

### 5.4 Lógica de design por trás das escolhas

- **Perigo anunciado.** O foco aparece antes de queimar e mostra o contador. A decisão é do jogador; ele não é surpreendido.
- **O sorteio vem antes da decisão.** O acaso escolhe onde o foco nasce, mas nunca decide sozinho o resultado: todo foco nasce em um ponto que alguém alcança. Um foco inalcançável seria só um dado tirando ponto do tabuleiro.
- **Abertura protegida.** Três rodadas sem fogo dão tempo de entender o movimento e de os cachorros abrirem a formação. Na rodada 4 já existem pontos vazios dos dois lados do tabuleiro.
- **Orçamento de perdas.** Uma partida típica tem de 11 a 12 focos e o limite é 5. Dá para deixar alguns queimarem por conveniência, mas não a metade. É essa conta que cria a pergunta "vale largar a disputa agora?".
- **Escalada.** Depois da rodada 24 o intervalo cai de 4 para 3 rodadas. A pressão cresce no final e a partida sempre termina.
- **Frente de fogo legível.** O peso maior na borda e ao lado de ponto queimado faz o fogo entrar pelas beiradas e avançar a partir do que já queimou, em vez de pipocar ao acaso. Os jogadores conseguem prever onde o risco está, e a imagem bate com o tema: a queimada vem de fora do território.
- **A toca como refúgio.** A toca nunca queima. É o último pedaço seguro do território da onça.

## 6. Ritmo: números adotados e como foram escolhidos

Rodamos `node tools/sim-fogo.mjs`: 4.000 partidas por configuração entre dois bots simples.

| Configuração | Território destruído | Rodadas (média) | Focos | Queimados |
| --- | --- | --- | --- | --- |
| Proposta original (foco a cada 2 rodadas, queima na rodada seguinte, limite 6) | 86% | 32 | 16,1 | 5,7 |
| **Adotada**, cachorros apagam metade das vezes que podem | 52% | 40 | 11,0 | 3,7 |
| **Adotada**, cachorros apagam 80% das vezes | 38% | 43 | 12,2 | 3,1 |
| **Adotada**, cachorros sempre apagam quando podem | 32% | 45 | 12,6 | 2,9 |
| Adotada com aviso de 1 rodada | 71% | 36 | 10,0 | 4,2 |
| Adotada com aviso de 3 rodadas | 17% | 47 | 13,4 | 2,1 |

Leitura:

- A regra original fazia o fogo decidir quase toda partida. Não havia disputa.
- O que mais muda o resultado é o **tempo de aviso**. Com 1 rodada o fogo domina; com 3 ele quase some. Com 2 ele ameaça sem decidir.
- Com os números adotados, jogadores descuidados perdem juntos em cerca de metade das partidas e jogadores atentos em cerca de um terço. Para um jogo de aula, em que a derrota coletiva é o assunto da conversa, é a faixa certa.
- A partida dura de 40 a 45 rodadas, cerca de 10 a 15 minutos.
- Se ninguém apagar nada, o território é destruído no fim da rodada 21.

**Limite desta simulação:** o bot dos cachorros é fraco e quase nunca fecha o cerco. Os números medem o ritmo do fogo, **não o equilíbrio entre onça e cachorros**. Esse equilíbrio precisa de um bot com busca (tarefa do motor) e de partidas com pessoas.

## 7. Cartas

As cartas são textos curtos que aparecem na tela. **Não mudam nenhuma regra.**

| Tipo | Gatilho | Frequência |
| --- | --- | --- |
| **Queimada** | Um ponto queima | Toda vez (no máximo 4 por partida; a 5ª queimada vai para a tela final) |
| **Cuidado** | Um foco é apagado | Na 1ª, 3ª, 5ª… vez, para não interromper demais |
| **Onça e Bororo** | A onça captura | Uma por jogada da onça, mesmo em captura em cadeia |

- São 18 cartas, 6 por tipo. Cada tipo é um baralho embaralhado no início da sessão.
- Uma carta não se repete até o baralho do tipo acabar. O baralho continua de uma partida para a outra, então a segunda partida (trocando de lado) mostra cartas novas.
- Baralho vazio: aquele gatilho deixa de mostrar carta.
- No máximo uma carta por jogada. Prioridade se dois gatilhos coincidirem: Queimada, depois Onça e Bororo, depois Cuidado.
- A carta abre depois da animação do evento, cobre o tabuleiro e fecha no botão "Continuar".
- A tela final lista as cartas que apareceram na partida, para reler na roda de conversa.

Formato do conteúdo, em `src/conteudo/cartas.json`:

```json
{
  "id": "queimada-01",
  "tipo": "queimada",
  "texto": "Até 220 caracteres, em 2 ou 3 linhas.",
  "fonte": { "titulo": "…", "autor": "…", "ano": 2024, "url": "https://…" }
}
```

Toda carta precisa de fonte conferida antes de entrar no jogo.

## 8. Tela final

| Resultado | Título | Quando |
| --- | --- | --- |
| Onça vence | "A onça venceu" | 5 capturas |
| Cachorros vencem | "Os cachorros cercaram a onça" | Cerco limpo |
| Território destruído | "Não há vencedor num território destruído" | 5 pontos queimados |
| Cerco com fogo | "O fogo fechou o cerco. Ninguém venceu" | Onça sem jogada com ajuda de ponto queimado |
| Empate | "Ninguém venceu" | Repetição, 100 rodadas ou cachorros sem jogada |

Abaixo do título: rodadas jogadas, cachorros capturados, focos apagados por cada lado e pontos queimados. Depois, as três perguntas da roda de conversa, as cartas da partida e os botões "Jogar de novo trocando de lado" e "Início".

## 9. Configuração

Todos os números ajustáveis ficam em um só lugar, `src/motor/config.ts`:

```ts
export const CONFIG = {
  capturasParaVencer: 5,
  maxRodadas: 100,
  repeticoesParaEmpate: 3,
  fogo: {
    primeiroFoco: 4,          // rodada do primeiro foco
    intervalo: 4,             // rodadas entre focos
    aceleraNaRodada: 24,      // a partir daqui usa intervaloFinal
    intervaloFinal: 3,
    aviso: 2,                 // rodadas entre nascer e queimar
    limiteQueimados: 5,
    pesoBorda: 1,
    pesoVizinhoQueimado: 2,
  },
  cartas: { porTipo: 6, cuidadoACada: 2 },
};
```

## 10. Requisitos do motor

- TypeScript puro, sem React e sem acesso à tela. A interface só lê o estado e envia jogadas.
- Estado imutável: `aplicar(estado, jogada) → novo estado + lista de eventos` (`moveu`, `capturou`, `focoNasceu`, `focoApagado`, `queimou`, `fim`). A interface anima e mostra cartas a partir dos eventos.
- Sorteio com semente guardada no estado, para repetir partidas nos testes.
- `jogadasPossiveis(estado)` é a única fonte de jogadas legais, usada pela interface e pelos bots.
- Testes cobrindo: os invariantes da seção 1, posição inicial, captura em cadeia, cada condição de fim, cada item da seção 5.1 e a ordem da seção 5.2.

## 11. O que ainda precisa de teste com pessoas

- Equilíbrio entre onça e cachorros com o fogo ligado.
- Se o aviso de 2 rodadas é claro para quem joga pela primeira vez.
- Se a regra do cerco com fogo é entendida sem explicação do mediador.
- Se a quantidade de cartas interrompe demais.
