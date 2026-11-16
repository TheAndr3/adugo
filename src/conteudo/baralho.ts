// Baralho e regras de disparo das 18 cartas educativas (docs/MECANICAS.md, seção 7).
// Puro e imutável: embaralha com semente no início da sessão, mantém as pilhas de uma
// partida para a outra (para não repetir cartas ao trocar de lado) e guarda a lista de
// cartas exibidas na partida atual para a roda de conversa na tela final.

import { CONFIG, type Config, type Evento, type Modo } from '../motor';
import cartasBrutas from './cartas.json';

export type TipoCarta = 'queimada' | 'cuidado' | 'onca';

export interface FonteCarta {
  readonly titulo: string;
  readonly autor: string;
  readonly ano: number;
  readonly url: string;
}

export interface Carta {
  readonly id: string;
  readonly tipo: TipoCarta;
  readonly texto: string;
  readonly fonte: FonteCarta;
}

export const CARTAS: readonly Carta[] = cartasBrutas as readonly Carta[];

export const TITULO_CARTA: Readonly<Record<TipoCarta, string>> = {
  queimada: 'Queimada',
  cuidado: 'Cuidado',
  onca: 'Onça e Bororo',
};

export interface BaralhoSessao {
  /** Cartas restantes de cada tipo nesta sessão (o índice 0 é o topo da pilha). */
  readonly pilhas: Readonly<Record<TipoCarta, readonly Carta[]>>;
  /** Quantos focos já foram apagados na partida atual (para disparar na 1ª, 3ª, 5ª… vez). */
  readonly apagadosNaPartida: number;
  /** Se a onça já disparou carta de captura na jogada atual (evita repetir em cadeia). */
  readonly oncaDisparouNaJogada: boolean;
  /** Cartas que apareceram na partida atual, na ordem em que saíram, para a tela final. */
  readonly cartasDaPartida: readonly Carta[];
  /** Estado interno do gerador pseudoaleatório. */
  readonly semente: number;
}

export interface PassoBaralho {
  readonly baralho: BaralhoSessao;
  /** Carta que deve ser aberta após a animação desta jogada, ou `null` se nenhuma. */
  readonly carta: Carta | null;
}

// ---------- Sorteio determinístico (mulberry32) ----------

function sortear(semente: number): { valor: number; semente: number } {
  const proxima = (semente + 0x6d2b79f5) >>> 0;
  let t = proxima;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { valor: ((t ^ (t >>> 14)) >>> 0) / 4294967296, semente: proxima };
}

function embaralhar<T>(itens: readonly T[], sementeInicial: number): { lista: T[]; semente: number } {
  const lista = [...itens];
  let semente = sementeInicial >>> 0;
  for (let i = lista.length - 1; i > 0; i--) {
    const r = sortear(semente);
    semente = r.semente;
    const j = Math.floor(r.valor * (i + 1));
    const tmp = lista[i]!;
    lista[i] = lista[j]!;
    lista[j] = tmp;
  }
  return { lista, semente };
}

// ---------- Criação e transição entre partidas ----------

/**
 * Cria e embaralha os 3 baralhos (6 cartas por tipo) para o início de uma sessão.
 */
export function criarBaralho(semente = 1, catalogo: readonly Carta[] = CARTAS): BaralhoSessao {
  const q = embaralhar(
    catalogo.filter((c) => c.tipo === 'queimada'),
    semente,
  );
  const cu = embaralhar(
    catalogo.filter((c) => c.tipo === 'cuidado'),
    q.semente,
  );
  const on = embaralhar(
    catalogo.filter((c) => c.tipo === 'onca'),
    cu.semente,
  );

  return {
    pilhas: {
      queimada: q.lista,
      cuidado: cu.lista,
      onca: on.lista,
    },
    apagadosNaPartida: 0,
    oncaDisparouNaJogada: false,
    cartasDaPartida: [],
    semente: on.semente,
  };
}

/**
 * Prepara o baralho para uma nova partida na mesma sessão (ex.: "Jogar de novo trocando de lado").
 * Mantém as pilhas de cartas restantes intactas para não repetir cartas já vistas, e limpa
 * os contadores e a lista de cartas da partida anterior.
 */
export function iniciarPartidaNoBaralho(baralho: BaralhoSessao): BaralhoSessao {
  return {
    ...baralho,
    apagadosNaPartida: 0,
    oncaDisparouNaJogada: false,
    cartasDaPartida: [],
  };
}

// ---------- Avaliação de gatilhos a cada jogada ----------

export interface OpcoesDeGatilho {
  readonly modo?: Modo;
  readonly config?: Config;
  /** Se a onça ainda está em cadeia após esta jogada (`estado.emCadeia`). */
  readonly emCadeia?: boolean;
}

/**
 * Avalia os eventos produzidos por `aplicar()` em uma jogada e decide se uma carta deve abrir.
 *
 * Regras (docs/MECANICAS.md, seção 7):
 * - Modo clássico não mostra cartas.
 * - Queimada: toda vez que um ponto queima, exceto na 5ª queimada (que leva direto à tela final).
 * - Onça e Bororo: quando a onça captura (no máximo 1 por jogada da onça, mesmo em captura em cadeia).
 * - Cuidado: quando um foco é apagado, na 1ª, 3ª, 5ª… vez (`cuidadoACada = 2`).
 * - Prioridade se mais de um gatilho ocorrer na mesma jogada: Queimada > Onça e Bororo > Cuidado.
 * - Se o baralho do tipo prioritário estiver vazio, aquele gatilho não mostra carta.
 */
export function extrairCartaDaJogada(
  baralho: BaralhoSessao,
  eventos: readonly Evento[],
  opcoes: OpcoesDeGatilho = {},
): PassoBaralho {
  const modo = opcoes.modo ?? 'territorio';
  const config = opcoes.config ?? CONFIG;

  if (modo === 'classico') {
    return { baralho, carta: null };
  }

  // Mesmo sem eventos (ex.: ao clicar em "Encerrar jogada" após captura em cadeia),
  // precisamos atualizar o flag `oncaDisparouNaJogada` quando `emCadeia === false`.
  if (eventos.length === 0) {
    const proximoFlagOnca = opcoes.emCadeia === false ? false : baralho.oncaDisparouNaJogada;
    if (proximoFlagOnca === baralho.oncaDisparouNaJogada) {
      return { baralho, carta: null };
    }
    return {
      baralho: { ...baralho, oncaDisparouNaJogada: proximoFlagOnca },
      carta: null,
    };
  }

  let apagadosNaPartida = baralho.apagadosNaPartida;
  let oncaDisparouNaJogada = baralho.oncaDisparouNaJogada;

  let gatilhoQueimada = false;
  let gatilhoOnca = false;
  let gatilhoCuidado = false;

  const destruiuTerritorio = eventos.some(
    (e) => e.tipo === 'fim' && e.resultado.tipo === 'territorio',
  );

  for (const ev of eventos) {
    if (ev.tipo === 'queimou') {
      // A 5ª queimada (que destrói o território) vai direto para a tela final.
      if (!destruiuTerritorio && ev.total < config.fogo.limiteQueimados) {
        gatilhoQueimada = true;
      }
    } else if (ev.tipo === 'capturou') {
      if (!oncaDisparouNaJogada) {
        gatilhoOnca = true;
        oncaDisparouNaJogada = true;
      }
    } else if (ev.tipo === 'focoApagado') {
      apagadosNaPartida++;
      if ((apagadosNaPartida - 1) % config.cartas.cuidadoACada === 0) {
        gatilhoCuidado = true;
      }
    }
  }

  // Se a jogada da onça encerrou (não está mais em cadeia) ou se os cachorros moveram/nova rodada começou,
  // libera o gatilho da onça para a próxima rodada.
  const trocouVezOuRodada =
    opcoes.emCadeia === false ||
    eventos.some((e) => e.tipo === 'rodadaComecou' || (e.tipo === 'moveu' && e.lado === 'caes'));

  const proximoFlagOnca = trocouVezOuRodada ? false : oncaDisparouNaJogada;

  // Ordem de prioridade: Queimada > Onça e Bororo > Cuidado.
  const candidatos: TipoCarta[] = [];
  if (gatilhoQueimada) candidatos.push('queimada');
  if (gatilhoOnca) candidatos.push('onca');
  if (gatilhoCuidado) candidatos.push('cuidado');

  // Se o tipo prioritário ainda tem cartas na pilha, puxa do topo.
  // Se a pilha daquele gatilho esgotou, ele deixa de mostrar carta (se houver outro gatilho
  // simultâneo na mesma jogada cuja pilha ainda tenha carta, permite exibir o seguinte).
  let escolhida: Carta | null = null;
  let novasPilhas = baralho.pilhas;

  for (const tipo of candidatos) {
    const pilha = baralho.pilhas[tipo];
    if (pilha.length > 0) {
      escolhida = pilha[0]!;
      novasPilhas = {
        ...baralho.pilhas,
        [tipo]: pilha.slice(1),
      };
      break;
    }
  }

  const novoBaralho: BaralhoSessao = {
    ...baralho,
    pilhas: novasPilhas,
    apagadosNaPartida,
    oncaDisparouNaJogada: proximoFlagOnca,
    cartasDaPartida: escolhida ? [...baralho.cartasDaPartida, escolhida] : baralho.cartasDaPartida,
  };

  return {
    baralho: novoBaralho,
    carta: escolhida,
  };
}
