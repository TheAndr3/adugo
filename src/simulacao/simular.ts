// Uma partida inteira entre dois bots, com o motor oficial, e o resumo do que aconteceu.

import { CONFIG, novaPartida, aplicar, type Config, type Modo, type Resultado } from '../motor';
import { escolherJogada, pulosBloqueadosPorFogo, sorteador, type PerfilBot } from './bots';

export interface OpcoesDePartida {
  readonly modo: Modo;
  readonly semente: number;
  readonly onca: PerfilBot;
  readonly caes: PerfilBot;
  readonly config?: Config;
}

export interface ResumoDaPartida {
  readonly resultado: Resultado;
  readonly rodadas: number;
  readonly capturas: number;
  readonly focos: number;
  readonly apagadosOnca: number;
  readonly apagadosCaes: number;
  readonly queimados: number;
  /** Vezes em que a onça, na sua vez, tinha um pulo fechado só porque o pouso estava queimado. */
  readonly pulosBloqueados: number;
  readonly jogadas: number;
}

export function jogarPartida({ modo, semente, onca, caes, config = CONFIG }: OpcoesDePartida): ResumoDaPartida {
  let estado = novaPartida({ modo, semente, config }).estado;
  const rnd = sorteador(semente ^ 0x9e3779b9);
  let pulosBloqueados = 0;
  let jogadas = 0;

  while (!estado.resultado) {
    if (estado.vez === 'onca' && !estado.emCadeia) pulosBloqueados += pulosBloqueadosPorFogo(estado);
    const perfil = estado.vez === 'onca' ? onca : caes;
    estado = aplicar(estado, escolherJogada(estado, perfil, rnd)).estado;
    jogadas++;
  }

  return {
    resultado: estado.resultado,
    rodadas: estado.rodada,
    capturas: estado.capturas,
    focos: estado.focosNascidos,
    apagadosOnca: estado.apagados.onca,
    apagadosCaes: estado.apagados.caes,
    queimados: estado.queimados.length,
    pulosBloqueados,
    jogadas,
  };
}
