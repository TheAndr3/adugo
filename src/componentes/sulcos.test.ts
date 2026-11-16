import { describe, expect, it, vi } from 'vitest';
import { PONTOS, VIZINHOS } from '../motor';
import { ALTURA, LARGURA, TRECHOS, posicao } from './sulcos';

describe('sulcos do tabuleiro', () => {
  it('tem um trecho para cada uma das 66 ligações do tabuleiro, sem repetir', () => {
    expect(TRECHOS).toHaveLength(66);
    const chaves = new Set(TRECHOS.map((t) => [t.a, t.b].sort().join('|')));
    expect(chaves.size).toBe(66);
    for (const t of TRECHOS) expect(VIZINHOS[t.a]).toContain(t.b);
  });

  it('cada trecho é um caminho SVG que começa perto do seu primeiro ponto', () => {
    for (const t of TRECHOS) {
      expect(t.d).toMatch(/^M-?[\d.]+ -?[\d.]+C/);
      const [x, y] = t.d.slice(1, t.d.indexOf('C')).split(' ').map(Number) as [number, number];
      const a = posicao(t.a);
      // Até 9 unidades de sobra além do ponto, no começo de cada linha.
      expect(Math.hypot(x - a.x, y - a.y)).toBeLessThanOrEqual(9.1);
    }
  });

  it('põe os 31 pontos dentro do quadro, com margem para as peças', () => {
    for (const p of PONTOS) {
      const { x, y } = posicao(p);
      expect(x).toBeGreaterThanOrEqual(60);
      expect(x).toBeLessThanOrEqual(LARGURA - 60);
      expect(y).toBeGreaterThanOrEqual(60);
      expect(y).toBeLessThanOrEqual(ALTURA - 60);
    }
  });

  it('é idêntico a cada carga (semente fixa)', async () => {
    vi.resetModules();
    const outra = await import('./sulcos');
    expect(outra.TRECHOS).not.toBe(TRECHOS);
    expect(outra.TRECHOS.map((t) => t.d)).toEqual(TRECHOS.map((t) => t.d));
  });
});
