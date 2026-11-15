// Geometria visual do tabuleiro (docs/ESTETICA.md, seção 4): onde cada ponto fica e o
// desenho dos sulcos. Cada uma das 18 linhas é um risco contínuo, levemente irregular,
// calculado uma vez com semente fixa — o tabuleiro é idêntico em toda partida.

import { LINHAS, coordenadas, type Ponto } from '../motor';

export const LARGURA = 520;
export const ALTURA = 720;

export interface XY {
  readonly x: number;
  readonly y: number;
}

export function posicao(p: Ponto): XY {
  const { r, c } = coordenadas(p);
  return { x: 60 + 100 * c, y: 60 + 100 * r };
}

/** Um trecho de sulco entre dois pontos vizinhos, já com o traçado SVG. */
export interface Trecho {
  readonly a: Ponto;
  readonly b: Ponto;
  readonly d: string;
}

function sorteador(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v: number): string => String(Math.round(v * 10) / 10);

function calcularTrechos(): Trecho[] {
  const sorteio = sorteador(1914);
  const trechos: Trecho[] = [];

  for (const linha of LINHAS) {
    const pts = linha.map(posicao);
    const primeiro = pts[0]!;
    const ultimo = pts[pts.length - 1]!;
    const comprimento = Math.hypot(ultimo.x - primeiro.x, ultimo.y - primeiro.y);
    const dir = { x: (ultimo.x - primeiro.x) / comprimento, y: (ultimo.y - primeiro.y) / comprimento };
    const normal = { x: -dir.y, y: dir.x };

    // Nós por onde o risco passa: sobra no começo, cada ponto, um desvio no meio de cada
    // trecho, sobra no fim. A sobra imita o graveto que passa um pouco do ponto.
    const sobra = (): number => 4 + sorteio() * 5;
    const nos: XY[] = [];
    const inicio = sobra();
    nos.push({ x: primeiro.x - dir.x * inicio, y: primeiro.y - dir.y * inicio });
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      nos.push(p);
      const q = pts[i + 1];
      if (q) {
        const desvio = (1.5 + sorteio() * 1.5) * (sorteio() < 0.5 ? -1 : 1);
        nos.push({ x: (p.x + q.x) / 2 + normal.x * desvio, y: (p.y + q.y) / 2 + normal.y * desvio });
      }
    }
    const fim = sobra();
    nos.push({ x: ultimo.x + dir.x * fim, y: ultimo.y + dir.y * fim });

    // Curva suave por todos os nós (Catmull-Rom convertida em Bézier cúbica).
    const no = (i: number): XY => nos[Math.max(0, Math.min(nos.length - 1, i))]!;
    const curva = (i: number): string => {
      const p0 = no(i - 1);
      const p1 = no(i);
      const p2 = no(i + 1);
      const p3 = no(i + 2);
      return `C${n(p1.x + (p2.x - p0.x) / 6)} ${n(p1.y + (p2.y - p0.y) / 6)} ${n(p2.x - (p3.x - p1.x) / 6)} ${n(
        p2.y - (p3.y - p1.y) / 6,
      )} ${n(p2.x)} ${n(p2.y)}`;
    };

    // O ponto i da linha é o nó 1 + 2i. Cada trecho tem duas curvas (ponto → meio → ponto);
    // o primeiro e o último levam também a sobra.
    for (let i = 0; i + 1 < linha.length; i++) {
      const k = 1 + 2 * i;
      const comeco = i === 0 ? 0 : k;
      const final = i + 2 === linha.length ? nos.length - 1 : k + 2;
      let d = `M${n(no(comeco).x)} ${n(no(comeco).y)}`;
      for (let j = comeco; j < final; j++) d += curva(j);
      trechos.push({ a: linha[i]!, b: linha[i + 1]!, d });
    }
  }
  return trechos;
}

/** Os 66 trechos de sulco. */
export const TRECHOS: readonly Trecho[] = calcularTrechos();
