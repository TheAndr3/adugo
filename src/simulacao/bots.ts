// Jogadores automáticos para o simulador de equilíbrio (issue 8). NÃO entram no jogo: a
// interface é só para duas pessoas. Servem para jogar milhares de partidas no terminal e
// medir quem vence com as regras e os números de src/motor/config.ts.
//
// Cada bot olha alguns lances à frente (busca "max^n": cada lado escolhe o lance melhor
// para si). O jogo não é de soma zero: o território destruído, o cerco com fogo e o
// empate são derrota para os dois lados ao mesmo tempo.
//
// Limite conhecido: o sorteio do foco usa a semente guardada no estado, então dentro do
// horizonte da busca o bot "sabe" onde o próximo foco vai nascer. Uma pessoa não sabe.

import { PONTOS, PULOS, VIZINHOS, aplicar, jogadasPossiveis, livre, type Estado, type Jogada, type Ponto } from '../motor';

export interface PerfilBot {
  /** Quantas jogadas a busca olha à frente (cada pulo de uma cadeia conta como uma). */
  readonly profundidade: number;
  /** Na vez dos cachorros, quantos lances seguem para a busca depois de uma triagem rápida. */
  readonly feixeCaes: number;
  /** Chance de, na raiz, escolher um dos três melhores em vez do melhor (imita erro humano). */
  readonly erro: number;
  /** Quanto o bot se importa com o território (0 = ignora o fogo até ele decidir a partida). */
  readonly pesoFogo: number;
  /** Pesos da avaliação da disputa. */
  readonly pesos: PesosDaDisputa;
  /**
   * Jogadas a mais na busca quando a onça já está quase presa (espaço de até 6 pontos).
   * Nessa hora ela tem poucos lances, a busca fica barata, e fechar o cerco pede um plano
   * de três ou quatro jogadas.
   */
  readonly fimDeCerco: number;
}

export interface PesosDaDisputa {
  /** Cada ponto que a onça alcança andando (mede o cerco). */
  readonly espaco: number;
  /** Cada cachorro que a onça poderia pular se chegasse perto. */
  readonly expostos: number;
  /** Cada pulo que a onça tem agora. */
  readonly pulos: number;
  /** Cada passo que a onça tem agora. */
  readonly passos: number;
  /** Cada ponto de distância média entre a onça e os cachorros (os cachorros querem chegar perto). */
  readonly aproximacao: number;
  /** Cada ponto de distância entre a onça e o cachorro exposto mais próximo (a onça quer chegar perto). */
  readonly caca: number;
}

export const PESOS_PADRAO: PesosDaDisputa = { espaco: 14, expostos: 18, pulos: 140, passos: 25, aproximacao: 0, caca: 0 };

/** Distância em passos pelas linhas entre dois pontos quaisquer, ignorando as peças. */
const DISTANCIA: Readonly<Record<Ponto, Readonly<Record<Ponto, number>>>> = Object.fromEntries(
  PONTOS.map((origem) => {
    const d: Record<Ponto, number> = { [origem]: 0 };
    const fila = [origem];
    for (let i = 0; i < fila.length; i++) {
      const p = fila[i]!;
      for (const v of VIZINHOS[p]!) if (d[v] === undefined) (d[v] = d[p]! + 1), fila.push(v);
    }
    return [origem, d];
  }),
);

export const PERFIL_FORTE: PerfilBot = { profundidade: 3, feixeCaes: 8, erro: 0, pesoFogo: 1, pesos: PESOS_PADRAO, fimDeCerco: 2 };
export const PERFIL_HUMANO: PerfilBot = { profundidade: 2, feixeCaes: 8, erro: 0.2, pesoFogo: 1, pesos: PESOS_PADRAO, fimDeCerco: 2 };

/** Utilidade de cada lado: [onça, cachorros]. Vitória e derrota valem ±VITORIA. */
export type Utilidade = readonly [onca: number, caes: number];

const VITORIA = 100_000;

export function sorteador(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantos passos e quantos pulos a onça teria agora, seja a vez de quem for. */
export function mobilidadeDaOnca(estado: Estado): { passos: number; pulos: number } {
  let passos = 0;
  let pulos = 0;
  for (const v of VIZINHOS[estado.onca]!) if (livre(estado, v)) passos++;
  for (const { sobre, pouso } of PULOS[estado.onca]!) {
    if (estado.caes.includes(sobre) && livre(estado, pouso)) pulos++;
  }
  return { passos, pulos };
}

/**
 * Espaço da onça: quantos pontos ela alcança andando por pontos livres. É a medida do
 * cerco. Os cachorros querem diminuí-lo; a onça, aumentá-lo.
 */
export function espacoDaOnca(estado: Estado): number {
  const visto = new Set([estado.onca]);
  const fila = [estado.onca];
  while (fila.length > 0) {
    const p = fila.pop()!;
    for (const v of VIZINHOS[p]!) {
      if (!visto.has(v) && livre(estado, v)) {
        visto.add(v);
        fila.push(v);
      }
    }
  }
  return visto.size - 1;
}

/**
 * Cachorros com ponto livre dos dois lados numa linha: a onça pode pulá-los se chegar lá.
 * Devolve também a distância da onça até o ponto de onde ela pularia o mais próximo.
 */
export function caesExpostos(estado: Estado): { quantos: number; distancia: number } {
  let quantos = 0;
  let distancia = 8;
  for (const c of estado.caes) {
    if (c === null) continue;
    let exposto = false;
    for (const { sobre: partida, pouso } of PULOS[c]!) {
      if ((partida === estado.onca || livre(estado, partida)) && livre(estado, pouso)) {
        exposto = true;
        distancia = Math.min(distancia, DISTANCIA[estado.onca]![partida]!);
      }
    }
    if (exposto) quantos++;
  }
  return { quantos, distancia };
}

/** Distância média, pelas linhas, entre a onça e os cachorros. */
export function distanciaMedia(estado: Estado): number {
  let soma = 0;
  let n = 0;
  for (const c of estado.caes) if (c !== null) (soma += DISTANCIA[estado.onca]![c]!), n++;
  return n === 0 ? 0 : soma / n;
}

/** Pulos que a onça teria se o ponto de pouso não estivesse queimado (seção 5.3). */
export function pulosBloqueadosPorFogo(estado: Estado): number {
  let n = 0;
  for (const { sobre, pouso } of PULOS[estado.onca]!) {
    if (estado.caes.includes(sobre) && estado.queimados.includes(pouso)) n++;
  }
  return n;
}

/** Valor de uma partida já encerrada, para cada lado. `restante` premia vencer mais cedo. */
function terminal(estado: Estado, restante: number): Utilidade {
  const bonus = restante * 10;
  switch (estado.resultado!.tipo) {
    case 'onca':
      return [VITORIA + bonus, -VITORIA - bonus];
    case 'caes':
      return [-VITORIA - bonus, VITORIA + bonus];
    default:
      // Território destruído, cerco com fogo ou empate: os dois perdem.
      return [-VITORIA - bonus, -VITORIA - bonus];
  }
}

/** Avaliação de uma posição em andamento. */
export function avaliar(estado: Estado, perfil: PerfilBot): Utilidade {
  const { passos, pulos } = mobilidadeDaOnca(estado);
  // Do ponto de vista da onça: cachorros capturados, ameaças de pulo e espaço para andar.
  // Ficar sem passo é perigoso mesmo com pulo à vista (o pulo pode ser fechado).
  const presa = passos === 0 ? 400 : passos === 1 ? 120 : 0;
  // O espaço empurra os cachorros a fechar o cerco e a onça a fugir dele; os expostos
  // empurram a onça a caçar e os cachorros a andar juntos.
  const p = perfil.pesos;
  const expostos = caesExpostos(estado);
  const disputa =
    1_000 * estado.capturas +
    p.pulos * pulos +
    p.passos * passos -
    presa +
    p.espaco * espacoDaOnca(estado) +
    p.expostos * expostos.quantos +
    p.aproximacao * distanciaMedia(estado) -
    (expostos.quantos > 0 ? p.caca * expostos.distancia : 0);

  let fogo = 0;
  if (estado.modo === 'territorio' && perfil.pesoFogo > 0) {
    const limite = estado.config.fogo.limiteQueimados;
    // O custo de cada queimada cresce perto do limite: a quarta pesa muito mais que a primeira.
    const custo = (q: number): number => (q >= limite ? VITORIA / 4 : 180 * q + 260 * q * q);
    const q = estado.queimados.length;
    fogo = custo(q);
    if (estado.foco) {
      // O foco ativo é uma queimada provável: mais certa quanto menos aviso resta.
      const chance = estado.foco.aviso <= 1 ? 0.8 : 0.45;
      fogo += chance * (custo(q + 1) - custo(q));
    }
    fogo *= perfil.pesoFogo;
  }
  return [disputa - fogo, -disputa - fogo];
}

function indiceDoLado(estado: Estado): 0 | 1 {
  return estado.vez === 'onca' ? 0 : 1;
}

/** Melhor para quem joga; no empate, o pior para o outro lado. */
function melhor(a: Utilidade, b: Utilidade, lado: 0 | 1): boolean {
  if (a[lado] !== b[lado]) return a[lado] > b[lado];
  return a[1 - lado]! < b[1 - lado]!;
}

/** Lances que seguem para a busca. Os da onça vão todos; os dos cachorros passam por triagem. */
function candidatos(estado: Estado, perfil: PerfilBot): Jogada[] {
  const jogadas = jogadasPossiveis(estado);
  if (estado.vez === 'onca' || jogadas.length <= perfil.feixeCaes) return jogadas;
  const notas = jogadas.map((j) => {
    const depois = aplicar(estado, j).estado;
    return { j, nota: depois.resultado ? terminal(depois, 0)[1] : avaliar(depois, perfil)[1] };
  });
  notas.sort((a, b) => b.nota - a.nota);
  return notas.slice(0, perfil.feixeCaes).map((n) => n.j);
}

function buscar(estado: Estado, profundidade: number, perfil: PerfilBot): Utilidade {
  if (estado.resultado) return terminal(estado, profundidade);
  if (profundidade === 0) return avaliar(estado, perfil);
  const lado = indiceDoLado(estado);
  let valor: Utilidade | null = null;
  for (const j of candidatos(estado, perfil)) {
    const v = buscar(aplicar(estado, j).estado, profundidade - 1, perfil);
    if (valor === null || melhor(v, valor, lado)) valor = v;
  }
  return valor ?? avaliar(estado, perfil);
}

/** Escolhe a jogada do lado da vez. `rnd` desempata e sorteia os erros. */
export function escolherJogada(estado: Estado, perfil: PerfilBot, rnd: () => number): Jogada {
  const lado = indiceDoLado(estado);
  const profundidade = perfil.profundidade + (espacoDaOnca(estado) <= 6 ? perfil.fimDeCerco : 0);
  const avaliadas = candidatos(estado, perfil).map((j) => ({
    j,
    v: buscar(aplicar(estado, j).estado, profundidade - 1, perfil),
    sorteio: rnd(),
  }));
  if (avaliadas.length === 0) throw new Error('Sem jogada possível');
  avaliadas.sort((a, b) => (melhor(a.v, b.v, lado) ? -1 : melhor(b.v, a.v, lado) ? 1 : a.sorteio - b.sorteio));
  if (perfil.erro > 0 && avaliadas.length > 1 && rnd() < perfil.erro) {
    // Erro humano: um dos três melhores, mas nunca um lance que perde na hora.
    const opcoes = avaliadas.slice(0, 3).filter((a) => a.v[lado] > -VITORIA);
    if (opcoes.length > 0) return opcoes[Math.floor(rnd() * opcoes.length)]!.j;
  }
  return avaliadas[0]!.j;
}
