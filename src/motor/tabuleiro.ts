// Tabuleiro do Adugo: 31 pontos definidos por 18 linhas retas (docs/MECANICAS.md, seção 1).
// Vizinhança e pulos são derivados das linhas; nada aqui é tabela escrita à mão.

/** Um ponto do tabuleiro, no formato "r,c" (fileira 0–6, coluna 0–4). */
export type Ponto = string;

export const ponto = (r: number, c: number): Ponto => `${r},${c}`;

export function coordenadas(p: Ponto): { r: number; c: number } {
  const [r, c] = p.split(',').map(Number) as [number, number];
  return { r, c };
}

const ate = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

export const LINHAS: readonly (readonly Ponto[])[] = [
  // fileiras da grade
  ...ate(5).map((r) => ate(5).map((c) => ponto(r, c))),
  // colunas laterais
  ...[0, 1, 3, 4].map((c) => ate(5).map((r) => ponto(r, c))),
  // coluna central, que entra na toca
  ate(7).map((r) => ponto(r, 2)),
  // diagonais grandes
  ate(5).map((i) => ponto(i, i)),
  ate(5).map((i) => ponto(i, 4 - i)),
  // diagonais curtas de cima
  [ponto(0, 2), ponto(1, 1), ponto(2, 0)],
  [ponto(0, 2), ponto(1, 3), ponto(2, 4)],
  // diagonais que viram os lados da toca
  [ponto(2, 0), ponto(3, 1), ponto(4, 2), ponto(5, 3), ponto(6, 4)],
  [ponto(2, 4), ponto(3, 3), ponto(4, 2), ponto(5, 1), ponto(6, 0)],
  // fileiras da toca
  [ponto(5, 1), ponto(5, 2), ponto(5, 3)],
  [ponto(6, 0), ponto(6, 2), ponto(6, 4)],
];

/** Os 31 pontos, ordenados por fileira e depois por coluna. */
export const PONTOS: readonly Ponto[] = [...new Set(LINHAS.flat())].sort((a, b) => {
  const A = coordenadas(a);
  const B = coordenadas(b);
  return A.r - B.r || A.c - B.c;
});

export interface Pulo {
  /** Ponto pulado (onde precisa haver um cachorro). */
  readonly sobre: Ponto;
  /** Ponto de pouso (precisa estar livre). */
  readonly pouso: Ponto;
}

const vizinhos: Record<Ponto, Ponto[]> = {};
const pulos: Record<Ponto, Pulo[]> = {};
for (const p of PONTOS) {
  vizinhos[p] = [];
  pulos[p] = [];
}
for (const linha of LINHAS) {
  for (let i = 0; i < linha.length; i++) {
    const a = linha[i]!;
    const b = linha[i + 1];
    const c = linha[i + 2];
    if (b !== undefined) {
      vizinhos[a]!.push(b);
      vizinhos[b]!.push(a);
    }
    if (b !== undefined && c !== undefined) {
      pulos[a]!.push({ sobre: b, pouso: c });
      pulos[c]!.push({ sobre: b, pouso: a });
    }
  }
}

/** Pontos ligados a cada ponto por um trecho de linha. */
export const VIZINHOS: Readonly<Record<Ponto, readonly Ponto[]>> = vizinhos;

/** Pulos possíveis a partir de cada ponto, em linha reta. */
export const PULOS: Readonly<Record<Ponto, readonly Pulo[]>> = pulos;

/** Os 6 pontos do triângulo. A boca da toca, (4,2), não faz parte. */
export const TOCA: ReadonlySet<Ponto> = new Set([
  ponto(5, 1),
  ponto(5, 2),
  ponto(5, 3),
  ponto(6, 0),
  ponto(6, 2),
  ponto(6, 4),
]);

/** Pontos da beirada da grade 5 × 5. */
export const BORDA: ReadonlySet<Ponto> = new Set(
  PONTOS.filter((p) => {
    const { r, c } = coordenadas(p);
    return r <= 4 && (r === 0 || r === 4 || c === 0 || c === 4);
  }),
);

export const ONCA_INICIAL: Ponto = ponto(2, 2);

/** Os 14 cachorros: fileiras 0 e 1 inteiras e a fileira 2 sem o centro. O índice é a identidade do cachorro. */
export const CAES_INICIAIS: readonly Ponto[] = [
  ...ate(5).map((c) => ponto(0, c)),
  ...ate(5).map((c) => ponto(1, c)),
  ponto(2, 0),
  ponto(2, 1),
  ponto(2, 3),
  ponto(2, 4),
];
