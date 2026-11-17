// Lógica de interação da tela da partida, sem React: o que um toque significa, o que os
// eventos do motor viram na tela e o que é anunciado para leitor de tela.

import type { Destino, EfeitoTabuleiro, Salto } from '../componentes/Tabuleiro';
import { coordenadas, jogadasPossiveis, type Estado, type Evento, type Jogada, type Ponto } from '../motor';

/** Na vez da onça ela já vem selecionada (só existe uma); na dos cachorros, ninguém. */
export function selecaoInicial(estado: Estado): Ponto | null {
  if (estado.resultado) return null;
  return estado.vez === 'onca' ? estado.onca : null;
}

/** Para onde a peça selecionada pode ir. */
export function destinosDe(estado: Estado, selecionado: Ponto | null): Destino[] {
  if (selecionado === null) return [];
  const destinos: Destino[] = [];
  for (const j of jogadasPossiveis(estado)) {
    if (j.tipo !== 'encerrar' && j.de === selecionado) destinos.push({ ponto: j.para, captura: j.tipo === 'pular' });
  }
  return destinos;
}

export type Toque =
  | { readonly tipo: 'jogar'; readonly jogada: Jogada }
  | { readonly tipo: 'selecionar'; readonly ponto: Ponto | null };

/**
 * O que fazer quando a pessoa toca em um ponto:
 * - destino da peça selecionada: joga;
 * - cachorro que pode andar, na vez dos cachorros: seleciona (ou troca a seleção);
 * - qualquer outro ponto: na vez dos cachorros desfaz a seleção; na da onça não muda nada.
 */
export function interpretarToque(estado: Estado, selecionado: Ponto | null, ponto: Ponto): Toque | null {
  if (estado.resultado) return null;
  const jogadas = jogadasPossiveis(estado);

  if (selecionado !== null) {
    const jogada = jogadas.find((j) => j.tipo !== 'encerrar' && j.de === selecionado && j.para === ponto);
    if (jogada) return { tipo: 'jogar', jogada };
  }

  if (estado.vez === 'onca') {
    return ponto === estado.onca && selecionado !== ponto ? { tipo: 'selecionar', ponto } : null;
  }

  const podeAndar = jogadas.some((j) => j.tipo === 'mover' && j.de === ponto);
  if (podeAndar) return ponto === selecionado ? null : { tipo: 'selecionar', ponto };
  return selecionado === null ? null : { tipo: 'selecionar', ponto: null };
}

export interface Encenacao {
  readonly efeitos: EfeitoTabuleiro[];
  readonly salto: Salto | null;
  readonly ultimaJogada: { readonly de: Ponto; readonly para: Ponto } | null;
  /** Milissegundos até a tela poder aceitar a próxima jogada ou abrir uma carta. */
  readonly espera: number;
}

/** Tempos das animações (docs/ESTETICA.md, seção 9), com uma folga pequena. */
const TEMPO = { andar: 240, pular: 340, nascer: 420, apagar: 320, queimar: 760 } as const;

/** Transforma os eventos de uma jogada no que o tabuleiro encena. `proximoId` numera os efeitos. */
export function encenar(eventos: readonly Evento[], proximoId: () => number): Encenacao {
  const efeitos: EfeitoTabuleiro[] = [];
  let salto: Salto | null = null;
  let ultimaJogada: Encenacao['ultimaJogada'] = null;
  let espera = 0;

  for (const e of eventos) {
    switch (e.tipo) {
      case 'moveu':
        salto = { id: proximoId(), peca: e.lado === 'onca' ? 'onca' : (e.cao ?? 'onca'), pulo: false };
        ultimaJogada = { de: e.de, para: e.para };
        espera = Math.max(espera, TEMPO.andar);
        break;
      case 'capturou':
        salto = { id: proximoId(), peca: 'onca', pulo: true };
        ultimaJogada = { de: e.de, para: e.para };
        efeitos.push({ id: proximoId(), tipo: 'captura', ponto: e.sobre, cao: e.cao });
        espera = Math.max(espera, TEMPO.pular);
        break;
      case 'focoApagado':
        efeitos.push({ id: proximoId(), tipo: 'apagado', ponto: e.ponto });
        espera = Math.max(espera, TEMPO.apagar);
        break;
      case 'queimou':
        efeitos.push({ id: proximoId(), tipo: 'queimou', ponto: e.ponto });
        espera = Math.max(espera, TEMPO.queimar);
        break;
      case 'focoNasceu':
        espera = Math.max(espera, TEMPO.nascer);
        break;
      default:
        break;
    }
  }
  return { efeitos, salto, ultimaJogada, espera };
}

const onde = (p: Ponto): string => {
  const { r, c } = coordenadas(p);
  return `fileira ${r + 1}, coluna ${c + 1}`;
};

const rodadas = (n: number): string => (n === 1 ? '1 rodada' : `${n} rodadas`);

export function textoDaVez(estado: Estado): string {
  if (estado.resultado) return 'Fim da partida';
  if (estado.emCadeia) return 'A onça pode pular de novo';
  return estado.vez === 'onca' ? 'Vez da onça' : 'Vez dos cachorros';
}

/** Frase para leitor de tela com o que acabou de acontecer e de quem é a vez. */
export function anunciar(eventos: readonly Evento[], estado: Estado): string {
  const frases: string[] = [];
  for (const e of eventos) {
    if (e.tipo === 'capturou') {
      frases.push(`A onça capturou um cachorro: ${estado.capturas} de ${estado.config.capturasParaVencer}.`);
    } else if (e.tipo === 'focoApagado') {
      frases.push(e.por === 'onca' ? 'A onça apagou o foco.' : 'Os cachorros apagaram o foco.');
    } else if (e.tipo === 'queimou') {
      frases.push(`O ponto da ${onde(e.ponto)} queimou: ${e.total} de ${estado.config.fogo.limiteQueimados}.`);
    } else if (e.tipo === 'focoNasceu') {
      frases.push(`Novo foco de calor na ${onde(e.ponto)}. Queima em ${rodadas(e.aviso)}.`);
    }
  }
  if (!estado.resultado) {
    frases.push(estado.emCadeia ? 'A onça pode pular de novo ou encerrar a jogada.' : `${textoDaVez(estado)}.`);
  }
  return frases.join(' ');
}

/**
 * Sair pede confirmação só quando há algo a perder: alguém já jogou e a partida não acabou.
 * Antes da primeira jogada da onça, ou na pausa depois do fim, sai direto.
 */
export function precisaConfirmarSaida(estado: Estado): boolean {
  if (estado.resultado) return false;
  return !(estado.rodada === 1 && estado.vez === 'onca' && !estado.emCadeia);
}

/** Linha de informação sobre o fogo, ou `null` no modo clássico. */
export function textoDoFogo(estado: Estado, proximoFoco: number | null): string | null {
  if (estado.modo !== 'territorio') return null;
  if (estado.foco) return `Foco queima em ${rodadas(estado.foco.aviso)}`;
  if (proximoFoco === null) return null;
  return `Próximo foco em ${rodadas(proximoFoco)}`;
}
