import { describe, expect, it } from 'vitest';
import { PASSOS_COMO_JOGAR } from './TelaComoJogar';

describe('TelaComoJogar — 4 passos com estados reais do motor', () => {
  it('define exatamente os 4 passos (andar, capturar, cercar, fogo)', () => {
    expect(PASSOS_COMO_JOGAR.map((p) => p.id)).toEqual([
      'andar',
      'capturar',
      'cercar',
      'fogo',
    ]);
  });

  it('demonstra captura em cadeia no passo 2, cerco limpo no passo 3 e foco apagado no passo 4', () => {
    const [, capturar, cercar, fogo] = PASSOS_COMO_JOGAR;

    // Passo 2 (capturar): começa com 0 capturas, vai a 1 (emCadeia) e termina com 2 capturas
    expect(capturar!.quadros[0]!.estado.capturas).toBe(0);
    expect(capturar!.quadros[1]!.estado.capturas).toBe(1);
    expect(capturar!.quadros[1]!.estado.emCadeia).toBe(true);
    expect(capturar!.quadros[2]!.estado.capturas).toBe(2);

    // Passo 3 (cercar): último quadro encerra com vitória dos cachorros
    expect(cercar!.quadros.at(-1)!.estado.resultado).toEqual({ tipo: 'caes' });

    // Passo 4 (fogo): começa com foco de aviso 2, cai para 1 e termina apagado
    expect(fogo!.quadros[0]!.estado.foco?.aviso).toBe(2);
    expect(fogo!.quadros[1]!.estado.foco?.aviso).toBe(1);
    expect(fogo!.quadros[2]!.estado.foco).toBeNull();
    expect(fogo!.quadros[2]!.estado.apagados.caes).toBe(1);
  });
});
