// Todos os números ajustáveis do jogo (docs/MECANICAS.md, seção 9).

export interface ConfigFogo {
  /** Rodada em que nasce o primeiro foco. */
  readonly primeiroFoco: number;
  /** Rodadas entre um foco e o seguinte. */
  readonly intervalo: number;
  /** A partir desta rodada vale `intervaloFinal`. */
  readonly aceleraNaRodada: number;
  readonly intervaloFinal: number;
  /** Rodadas entre o foco nascer e queimar. */
  readonly aviso: number;
  /** Com este número de pontos queimados os dois lados perdem. */
  readonly limiteQueimados: number;
  /** Peso extra no sorteio para pontos da borda da grade. */
  readonly pesoBorda: number;
  /** Peso extra no sorteio para vizinhos de ponto já queimado. */
  readonly pesoVizinhoQueimado: number;
}

export interface Config {
  readonly capturasParaVencer: number;
  readonly maxRodadas: number;
  readonly repeticoesParaEmpate: number;
  readonly fogo: ConfigFogo;
  readonly cartas: { readonly porTipo: number; readonly cuidadoACada: number };
}

export const CONFIG: Config = {
  capturasParaVencer: 5,
  maxRodadas: 100,
  repeticoesParaEmpate: 3,
  fogo: {
    primeiroFoco: 4,
    intervalo: 4,
    aceleraNaRodada: 24,
    intervaloFinal: 3,
    aviso: 2,
    limiteQueimados: 5,
    pesoBorda: 1,
    pesoVizinhoQueimado: 2,
  },
  cartas: { porTipo: 6, cuidadoACada: 2 },
};
