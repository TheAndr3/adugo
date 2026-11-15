// Motor de regras do Adugo: Território da Onça (docs/MECANICAS.md).
// Puro: não conhece tela nem React. A interface lê o Estado, pede `jogadasPossiveis`
// e chama `aplicar`, que devolve um novo Estado e a lista de eventos do que aconteceu.

import { CONFIG, type Config } from './config';
import {
  BORDA,
  CAES_INICIAIS,
  ONCA_INICIAL,
  PONTOS,
  PULOS,
  TOCA,
  VIZINHOS,
  type Ponto,
} from './tabuleiro';

export type Lado = 'onca' | 'caes';
export type Modo = 'classico' | 'territorio';

export interface Foco {
  readonly ponto: Ponto;
  /** Rodadas que faltam para queimar (contando a atual). */
  readonly aviso: number;
}

export type Resultado =
  | { readonly tipo: 'onca' }
  | { readonly tipo: 'caes' }
  | { readonly tipo: 'territorio' }
  | { readonly tipo: 'cercoComFogo' }
  | { readonly tipo: 'empate'; readonly motivo: 'repeticao' | 'limiteDeRodadas' | 'caesSemJogada' };

export interface Estado {
  readonly modo: Modo;
  readonly config: Config;
  /** Uma rodada é a jogada da onça seguida da jogada dos cachorros. Começa em 1. */
  readonly rodada: number;
  readonly vez: Lado;
  readonly onca: Ponto;
  /** Posição de cada cachorro pelo seu índice (0–13); `null` se foi capturado. */
  readonly caes: readonly (Ponto | null)[];
  readonly capturas: number;
  /** A onça acabou de capturar e pode pular de novo ou encerrar a jogada. */
  readonly emCadeia: boolean;
  readonly queimados: readonly Ponto[];
  readonly foco: Foco | null;
  readonly focosNascidos: number;
  readonly apagados: { readonly onca: number; readonly caes: number };
  /** Estado do sorteio. Mesma semente e mesmas jogadas dão a mesma partida. */
  readonly semente: number;
  /** Quantas vezes cada posição já apareceu no início de uma jogada. */
  readonly repeticoes: Readonly<Record<string, number>>;
  readonly resultado: Resultado | null;
}

export type Jogada =
  | { readonly tipo: 'mover'; readonly de: Ponto; readonly para: Ponto }
  | { readonly tipo: 'pular'; readonly de: Ponto; readonly sobre: Ponto; readonly para: Ponto }
  | { readonly tipo: 'encerrar' };

export type Evento =
  | { readonly tipo: 'rodadaComecou'; readonly rodada: number }
  | { readonly tipo: 'moveu'; readonly lado: Lado; readonly cao: number | null; readonly de: Ponto; readonly para: Ponto }
  | { readonly tipo: 'capturou'; readonly cao: number; readonly de: Ponto; readonly sobre: Ponto; readonly para: Ponto }
  | { readonly tipo: 'focoNasceu'; readonly ponto: Ponto; readonly aviso: number }
  | { readonly tipo: 'focoAviso'; readonly ponto: Ponto; readonly aviso: number }
  | { readonly tipo: 'focoApagado'; readonly ponto: Ponto; readonly por: Lado }
  | { readonly tipo: 'queimou'; readonly ponto: Ponto; readonly total: number }
  | { readonly tipo: 'fim'; readonly resultado: Resultado };

export interface Passo {
  readonly estado: Estado;
  readonly eventos: readonly Evento[];
}

type Rascunho = {
  -readonly [K in keyof Estado]: Estado[K];
} & {
  caes: (Ponto | null)[];
  queimados: Ponto[];
  apagados: { onca: number; caes: number };
  repeticoes: Record<string, number>;
};

// ---------- Sorteio com semente (mulberry32) ----------

function sortear(semente: number): { valor: number; semente: number } {
  const proxima = (semente + 0x6d2b79f5) >>> 0;
  let t = proxima;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { valor: ((t ^ (t >>> 14)) >>> 0) / 4294967296, semente: proxima };
}

// ---------- Consultas ----------

type Posicao = Pick<Estado, 'onca' | 'caes' | 'queimados'>;

/** Ponto sem peça e não queimado. Um foco de calor não bloqueia: entrar nele é apagar. */
export function livre(s: Posicao, p: Ponto): boolean {
  return s.onca !== p && !s.caes.includes(p) && !s.queimados.includes(p);
}

function jogadasDaOnca(s: Posicao, soPulos = false): Jogada[] {
  const jogadas: Jogada[] = [];
  for (const { sobre, pouso } of PULOS[s.onca]!) {
    if (s.caes.includes(sobre) && livre(s, pouso)) jogadas.push({ tipo: 'pular', de: s.onca, sobre, para: pouso });
  }
  if (soPulos) return jogadas;
  for (const para of VIZINHOS[s.onca]!) {
    if (livre(s, para)) jogadas.push({ tipo: 'mover', de: s.onca, para });
  }
  return jogadas;
}

function jogadasDosCaes(s: Posicao): Jogada[] {
  const jogadas: Jogada[] = [];
  for (const de of s.caes) {
    if (de === null) continue;
    for (const para of VIZINHOS[de]!) {
      if (livre(s, para)) jogadas.push({ tipo: 'mover', de, para });
    }
  }
  return jogadas;
}

/** Única fonte de jogadas legais, para a interface e para os bots. Vazia quando a partida acabou. */
export function jogadasPossiveis(estado: Estado): Jogada[] {
  if (estado.resultado) return [];
  if (estado.vez === 'caes') return jogadasDosCaes(estado);
  if (estado.emCadeia) return [...jogadasDaOnca(estado, true), { tipo: 'encerrar' }];
  return jogadasDaOnca(estado);
}

/**
 * O fogo participou do cerco? Verdadeiro se a onça teria alguma jogada caso os pontos
 * queimados estivessem vazios. Só faz sentido chamar quando a onça está sem jogada.
 */
export function fogoAjudouCerco(s: Posicao): boolean {
  return jogadasDaOnca({ ...s, queimados: [] }).length > 0;
}

/** Nasce foco no início desta rodada? */
export function rodadaDeFoco(rodada: number, config: Config = CONFIG): boolean {
  const f = config.fogo;
  if (rodada < f.primeiroFoco) return false;
  if (rodada < f.aceleraNaRodada) return (rodada - f.primeiroFoco) % f.intervalo === 0;
  return (rodada - f.aceleraNaRodada) % f.intervaloFinal === 0;
}

/** Rodadas até o próximo foco nascer, ou `null` no modo clássico. Zero não acontece: o desta rodada já nasceu. */
export function proximoFocoEm(estado: Estado): number | null {
  if (estado.modo !== 'territorio') return null;
  for (let r = estado.rodada + 1; r <= estado.rodada + 64; r++) {
    if (rodadaDeFoco(r, estado.config)) return r - estado.rodada;
  }
  return null;
}

// ---------- Transições ----------

function terminar(s: Rascunho, eventos: Evento[], resultado: Resultado): void {
  s.resultado = resultado;
  s.emCadeia = false;
  eventos.push({ tipo: 'fim', resultado });
}

function chaveDaPosicao(s: Rascunho): string {
  const caes = s.caes.filter((c): c is Ponto => c !== null).sort();
  const foco = s.foco ? `${s.foco.ponto}:${s.foco.aviso}` : '';
  return [s.vez, s.onca, caes.join(' '), [...s.queimados].sort().join(' '), foco].join('|');
}

/** Conta a posição no início de uma jogada e declara empate na repetição. */
function registrarPosicao(s: Rascunho, eventos: Evento[]): void {
  const chave = chaveDaPosicao(s);
  const vezes = (s.repeticoes[chave] ?? 0) + 1;
  s.repeticoes[chave] = vezes;
  if (vezes >= s.config.repeticoesParaEmpate) terminar(s, eventos, { tipo: 'empate', motivo: 'repeticao' });
}

function apagarSeFoco(s: Rascunho, eventos: Evento[], por: Lado, onde: Ponto): void {
  if (s.foco?.ponto !== onde) return;
  s.foco = null;
  s.apagados[por]++;
  eventos.push({ tipo: 'focoApagado', ponto: onde, por });
}

/**
 * Sorteia onde nasce o foco: ponto vazio, fora da toca, que alguma peça alcança em até
 * `aviso` jogadas por caminho livre. Borda e vizinhos de queimado pesam mais.
 */
function nascerFoco(s: Rascunho, eventos: Evento[]): void {
  const f = s.config.fogo;
  const alcance = new Set<Ponto>();
  let fronteira: Ponto[] = [s.onca, ...s.caes.filter((c): c is Ponto => c !== null)];
  for (let passo = 0; passo < f.aviso; passo++) {
    const proxima: Ponto[] = [];
    for (const de of fronteira) {
      for (const para of VIZINHOS[de]!) {
        if (livre(s, para) && !alcance.has(para)) {
          alcance.add(para);
          proxima.push(para);
        }
      }
    }
    fronteira = proxima;
  }
  const candidatos = PONTOS.filter((p) => alcance.has(p) && !TOCA.has(p));
  if (candidatos.length === 0) return;

  const pesos = candidatos.map(
    (p) =>
      1 +
      (BORDA.has(p) ? f.pesoBorda : 0) +
      (VIZINHOS[p]!.some((v) => s.queimados.includes(v)) ? f.pesoVizinhoQueimado : 0),
  );
  const sorteio = sortear(s.semente);
  s.semente = sorteio.semente;
  let alvo = sorteio.valor * pesos.reduce((a, b) => a + b, 0);
  let escolhido = candidatos[candidatos.length - 1]!;
  for (let i = 0; i < candidatos.length; i++) {
    alvo -= pesos[i]!;
    if (alvo < 0) {
      escolhido = candidatos[i]!;
      break;
    }
  }
  s.foco = { ponto: escolhido, aviso: f.aviso };
  s.focosNascidos++;
  eventos.push({ tipo: 'focoNasceu', ponto: escolhido, aviso: f.aviso });
}

function comecarRodada(s: Rascunho, eventos: Evento[]): void {
  s.vez = 'onca';
  eventos.push({ tipo: 'rodadaComecou', rodada: s.rodada });
  if (s.modo === 'territorio' && !s.foco && rodadaDeFoco(s.rodada, s.config)) nascerFoco(s, eventos);
  registrarPosicao(s, eventos);
}

function passarParaCaes(s: Rascunho, eventos: Evento[]): void {
  s.emCadeia = false;
  s.vez = 'caes';
  if (jogadasDosCaes(s).length === 0) {
    terminar(s, eventos, { tipo: 'empate', motivo: 'caesSemJogada' });
    return;
  }
  registrarPosicao(s, eventos);
}

/** Depois da jogada dos cachorros: cerco, depois o fogo, depois a próxima rodada. A vitória vem sempre antes do fogo. */
function fecharRodada(s: Rascunho, eventos: Evento[]): void {
  if (jogadasDaOnca(s).length === 0) {
    terminar(s, eventos, { tipo: fogoAjudouCerco(s) ? 'cercoComFogo' : 'caes' });
    return;
  }

  if (s.foco) {
    const aviso = s.foco.aviso - 1;
    if (aviso > 0) {
      s.foco = { ponto: s.foco.ponto, aviso };
      eventos.push({ tipo: 'focoAviso', ponto: s.foco.ponto, aviso });
    } else {
      const queimado = s.foco.ponto;
      s.foco = null;
      s.queimados.push(queimado);
      eventos.push({ tipo: 'queimou', ponto: queimado, total: s.queimados.length });
      if (s.queimados.length >= s.config.fogo.limiteQueimados) {
        terminar(s, eventos, { tipo: 'territorio' });
        return;
      }
      if (jogadasDaOnca(s).length === 0) {
        terminar(s, eventos, { tipo: 'cercoComFogo' });
        return;
      }
    }
  }

  if (s.rodada >= s.config.maxRodadas) {
    terminar(s, eventos, { tipo: 'empate', motivo: 'limiteDeRodadas' });
    return;
  }
  s.rodada++;
  comecarRodada(s, eventos);
}

const mesmaJogada = (a: Jogada, b: Jogada): boolean =>
  a.tipo === b.tipo &&
  (a.tipo === 'encerrar' ||
    (b.tipo !== 'encerrar' &&
      a.de === b.de &&
      a.para === b.para &&
      (a.tipo !== 'pular' || (b.tipo === 'pular' && a.sobre === b.sobre))));

/** Aplica uma jogada legal e devolve o novo estado e os eventos. Não altera o estado recebido. */
export function aplicar(estado: Estado, jogada: Jogada): Passo {
  if (estado.resultado) throw new Error('A partida já terminou.');
  if (!jogadasPossiveis(estado).some((j) => mesmaJogada(j, jogada))) {
    throw new Error(`Jogada inválida: ${JSON.stringify(jogada)}`);
  }

  const s: Rascunho = {
    ...estado,
    caes: [...estado.caes],
    queimados: [...estado.queimados],
    apagados: { ...estado.apagados },
    repeticoes: { ...estado.repeticoes },
  };
  const eventos: Evento[] = [];

  if (jogada.tipo === 'encerrar') {
    passarParaCaes(s, eventos);
  } else if (s.vez === 'onca') {
    s.onca = jogada.para;
    if (jogada.tipo === 'pular') {
      const cao = s.caes.indexOf(jogada.sobre);
      s.caes[cao] = null;
      s.capturas++;
      eventos.push({ tipo: 'capturou', cao, de: jogada.de, sobre: jogada.sobre, para: jogada.para });
      apagarSeFoco(s, eventos, 'onca', jogada.para);
      if (s.capturas >= s.config.capturasParaVencer) terminar(s, eventos, { tipo: 'onca' });
      else if (jogadasDaOnca(s, true).length > 0) s.emCadeia = true;
      else passarParaCaes(s, eventos);
    } else {
      eventos.push({ tipo: 'moveu', lado: 'onca', cao: null, de: jogada.de, para: jogada.para });
      apagarSeFoco(s, eventos, 'onca', jogada.para);
      passarParaCaes(s, eventos);
    }
  } else {
    const cao = s.caes.indexOf(jogada.de);
    s.caes[cao] = jogada.para;
    eventos.push({ tipo: 'moveu', lado: 'caes', cao, de: jogada.de, para: jogada.para });
    apagarSeFoco(s, eventos, 'caes', jogada.para);
    fecharRodada(s, eventos);
  }

  return { estado: s, eventos };
}

// ---------- Criação de partidas ----------

export interface OpcoesDeEstado {
  readonly modo?: Modo;
  readonly config?: Config;
  readonly semente?: number;
  readonly rodada?: number;
  readonly vez?: Lado;
  readonly onca?: Ponto;
  readonly caes?: readonly (Ponto | null)[];
  readonly capturas?: number;
  readonly queimados?: readonly Ponto[];
  readonly foco?: Foco | null;
}

/**
 * Monta um estado qualquer, sem validar nem sortear nada. Serve para os testes e para os
 * mini tabuleiros de "Como se joga". Para uma partida de verdade, use `novaPartida`.
 */
export function criarEstado(opcoes: OpcoesDeEstado = {}): Estado {
  return {
    modo: opcoes.modo ?? 'classico',
    config: opcoes.config ?? CONFIG,
    rodada: opcoes.rodada ?? 1,
    vez: opcoes.vez ?? 'onca',
    onca: opcoes.onca ?? ONCA_INICIAL,
    caes: opcoes.caes ?? CAES_INICIAIS,
    capturas: opcoes.capturas ?? 0,
    emCadeia: false,
    queimados: opcoes.queimados ?? [],
    foco: opcoes.foco ?? null,
    focosNascidos: 0,
    apagados: { onca: 0, caes: 0 },
    semente: opcoes.semente ?? 1,
    repeticoes: {},
    resultado: null,
  };
}

/** Começa uma partida na posição inicial. A onça joga primeiro. */
export function novaPartida(opcoes: { modo: Modo; semente: number; config?: Config }): Passo {
  const s = criarEstado(opcoes) as Rascunho;
  s.caes = [...s.caes];
  s.queimados = [];
  const eventos: Evento[] = [];
  comecarRodada(s, eventos);
  return { estado: s, eventos };
}
