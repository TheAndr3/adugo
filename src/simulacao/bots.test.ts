import { describe, expect, it } from 'vitest';
import { aplicar, criarEstado, jogadasPossiveis, ponto as P } from '../motor';
import { PERFIL_FORTE, PERFIL_HUMANO, avaliar, escolherJogada, pulosBloqueadosPorFogo, sorteador } from './bots';
import { jogarPartida } from './simular';

const rnd = () => sorteador(1);

describe('bots do simulador', () => {
  it('os cachorros fecham um cerco limpo de uma jogada', () => {
    const s = criarEstado({ vez: 'caes', onca: P(6, 0), caes: [P(5, 1), P(4, 2), P(6, 4), P(5, 2), P(0, 0)] });
    expect(escolherJogada(s, PERFIL_FORTE, rnd())).toEqual({ tipo: 'mover', de: P(5, 2), para: P(6, 2) });
  });

  it('a onça faz a captura que vence a partida', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0), P(0, 4)], capturas: 4 });
    expect(escolherJogada(s, PERFIL_FORTE, rnd())).toEqual({ tipo: 'pular', de: P(2, 2), sobre: P(2, 3), para: P(2, 4) });
  });

  it('os cachorros tiram do caminho um cachorro que seria capturado', () => {
    // A onça em (2,2) pula (2,3) se (2,4) ficar livre; cobrir (2,4) ou sair de (2,3) evita.
    const s = criarEstado({ vez: 'caes', onca: P(2, 2), caes: [P(2, 3), P(1, 4), P(0, 0)] });
    const depois = aplicar(s, escolherJogada(s, PERFIL_FORTE, rnd())).estado;
    expect(jogadasPossiveis(depois).some((j) => j.tipo === 'pular')).toBe(false);
  });

  it('com o território quase destruído, alguém apaga o foco', () => {
    const s = criarEstado({
      modo: 'territorio',
      rodada: 9,
      vez: 'caes',
      onca: P(4, 4),
      caes: [P(2, 0), P(0, 4), P(0, 3)],
      queimados: [P(0, 0), P(0, 1), P(4, 0), P(1, 0)],
      foco: { ponto: P(3, 0), aviso: 1 },
    });
    expect(escolherJogada(s, PERFIL_FORTE, rnd())).toEqual({ tipo: 'mover', de: P(2, 0), para: P(3, 0) });
  });

  it('o fogo pesa igual para os dois lados na avaliação', () => {
    const s = criarEstado({ modo: 'territorio', queimados: [P(4, 0), P(4, 4)] });
    const sem = avaliar(s, { ...PERFIL_FORTE, pesoFogo: 0 });
    const com = avaliar(s, PERFIL_FORTE);
    expect(sem[0] - com[0]).toBeGreaterThan(0);
    expect(sem[0] - com[0]).toBeCloseTo(sem[1] - com[1]);
  });

  it('conta o pulo fechado por um pouso queimado', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(1, 2)], queimados: [P(2, 4)] });
    expect(pulosBloqueadosPorFogo(s)).toBe(1);
  });

  it('jogam partidas inteiras até o fim nos dois modos', () => {
    for (const modo of ['classico', 'territorio'] as const) {
      const r = jogarPartida({ modo, semente: 3, onca: PERFIL_HUMANO, caes: PERFIL_HUMANO });
      expect(r.resultado).toBeTruthy();
      expect(r.rodadas).toBeGreaterThan(1);
      if (modo === 'classico') expect(r.focos).toBe(0);
    }
  }, 60_000);
});
