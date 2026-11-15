// Monta src/arte/capa/capa.svg a partir dos assets de src/arte, para a capa ter
// exatamente a mesma cara do jogo (docs/ESTETICA.md, seção 5.3).
// Uso: npm run arte:capa   (rodar de novo sempre que um asset usado aqui mudar)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../src/arte/', import.meta.url));
const n = (v) => String(Math.round(v * 10) / 10);

// ---------- Assets como <symbol> ----------
function simbolo(caminho) {
  const svg = readFileSync(raiz + caminho, 'utf8').trim();
  const abre = svg.match(/^<svg([^>]*)>/);
  const viewBox = abre[1].match(/viewBox="([^"]+)"/)[1];
  const resto = abre[1].replace(/\s*xmlns="[^"]*"/, '').replace(/\s*viewBox="[^"]*"/, '').trim();
  const miolo = svg.slice(abre[0].length, svg.lastIndexOf('</svg>'));
  const nome = caminho.split('/').pop().replace('.svg', '');
  const corpo = (resto ? `<g ${resto}>${miolo}</g>` : miolo)
    .replace(/id="/g, 'id="capa-')
    .replace(/url\(#/g, 'url(#capa-')
    .replace(/href="#/g, 'href="#capa-')
    .replace(/ class="[^"]*"/g, '');
  return { id: `capa-s-${nome}`, texto: `<symbol id="capa-s-${nome}" viewBox="${viewBox}">${corpo}</symbol>` };
}

const S = {
  onca: simbolo('pecas/onca.svg'),
  caoA: simbolo('pecas/cachorro-a.svg'),
  caoB: simbolo('pecas/cachorro-b.svg'),
  caoC: simbolo('pecas/cachorro-c.svg'),
  foco: simbolo('fogo/foco.svg'),
  fumaca: simbolo('fogo/fumaca.svg'),
  capim: simbolo('chao/capim.svg'),
};
const usar = (s, cx, cy, tamanho, altura = tamanho) =>
  `<use href="#${s.id}" x="${n(cx - tamanho / 2)}" y="${n(cy - altura / 2)}" width="${n(tamanho)}" height="${n(altura)}"/>`;
const sombra = (cx, cy, tamanho) =>
  `<ellipse cx="${n(cx + tamanho * 0.06)}" cy="${n(cy + tamanho * 0.09)}" rx="${n(tamanho * 0.46)}" ry="${n(tamanho * 0.42)}" fill="#231F1D" opacity=".26"/>`;

// ---------- Canto do tabuleiro: mesmo risco irregular do jogo ----------
let semente = 1914;
const sorteio = () => {
  semente = (semente + 0x6d2b79f5) >>> 0;
  let t = semente;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const PASSO = 200;
const GIRO = (-9 * Math.PI) / 180;
const ORIGEM = { x: 470, y: 170 };
/** Ponto (coluna, fileira) do canto do tabuleiro, já na posição da capa. */
const xy = (c, r) => ({
  x: ORIGEM.x + PASSO * (c * Math.cos(GIRO) - r * Math.sin(GIRO)),
  y: ORIGEM.y + PASSO * (c * Math.sin(GIRO) + r * Math.cos(GIRO)),
});

const COLS = 5; // a última coluna e a última fileira saem do quadro
const FILS = 5;
const linhas = [];
for (let r = 0; r < FILS; r++) linhas.push(Array.from({ length: COLS }, (_, c) => [c, r]));
for (let c = 0; c < COLS; c++) linhas.push(Array.from({ length: FILS }, (_, r) => [c, r]));
linhas.push([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
linhas.push([[2, 0], [1, 1], [0, 2]]);
linhas.push([[2, 0], [3, 1], [4, 2]]);
linhas.push([[4, 0], [3, 1], [2, 2], [1, 3], [0, 4]]);
linhas.push([[0, 2], [1, 3], [2, 4]]);
linhas.push([[4, 2], [3, 3], [2, 4]]);

function risco(pontos) {
  const pts = pontos.map(([c, r]) => xy(c, r));
  const a = pts[0], z = pts[pts.length - 1];
  const comp = Math.hypot(z.x - a.x, z.y - a.y);
  const dir = { x: (z.x - a.x) / comp, y: (z.y - a.y) / comp };
  const nos = [{ x: a.x - dir.x * (8 + sorteio() * 10), y: a.y - dir.y * (8 + sorteio() * 10) }];
  pts.forEach((p, i) => {
    nos.push(p);
    const q = pts[i + 1];
    if (q) {
      const desvio = (3 + sorteio() * 3) * (sorteio() < 0.5 ? -1 : 1);
      nos.push({ x: (p.x + q.x) / 2 - dir.y * desvio, y: (p.y + q.y) / 2 + dir.x * desvio });
    }
  });
  nos.push({ x: z.x + dir.x * (8 + sorteio() * 10), y: z.y + dir.y * (8 + sorteio() * 10) });
  const no = (i) => nos[Math.max(0, Math.min(nos.length - 1, i))];
  let d = `M${n(nos[0].x)} ${n(nos[0].y)}`;
  for (let i = 0; i < nos.length - 1; i++) {
    const p0 = no(i - 1), p1 = no(i), p2 = no(i + 1), p3 = no(i + 2);
    d += `C${n(p1.x + (p2.x - p0.x) / 6)} ${n(p1.y + (p2.y - p0.y) / 6)} ${n(p2.x - (p3.x - p1.x) / 6)} ${n(p2.y - (p3.y - p1.y) / 6)} ${n(p2.x)} ${n(p2.y)}`;
  }
  return d;
}
const sulcos = linhas.map(risco).join('');

const covinhas = [];
for (let r = 0; r < FILS; r++) for (let c = 0; c < COLS; c++) {
  const p = xy(c, r);
  if (p.x < 1240 && p.y < 940) covinhas.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="20"/>`);
}

// ---------- Peças ----------
const CAO = 116;
const caes = [
  [S.caoA, 1, 0], [S.caoB, 2, 0], [S.caoC, 3, 0], [S.caoB, 2, 1], [S.caoA, 3, 1],
].map(([s, c, r], i) => ({ s, ...xy(c, r), t: CAO * [1, 0.95, 1.04, 0.97, 1.02][i] }));
const onca = { ...xy(0, 1), t: 196 };
const foco = { ...xy(3, 2), t: 190 };

// A capa é transparente: o chão é o da própria página (o mesmo ladrilho do jogo).
// Não usar aqui feTurbulence nem degradê em traço: nos testes, os dois travaram o desenho
// no navegador por vários segundos. Quem mostra a capa pode esmaecer a parte de baixo com
// uma máscara em CSS (mask-image), que é leve.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
<defs>
<path id="capa-sulcos" d="${sulcos}"/>
${Object.values(S).map((s) => s.texto).join('')}
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<use href="#capa-sulcos" stroke="#EBD3A8" stroke-width="16" opacity=".7" transform="translate(3.6 3.6)"/>
<use href="#capa-sulcos" stroke="#6B4226" stroke-width="14"/>
<use href="#capa-sulcos" stroke="#4A2E1A" stroke-width="6" opacity=".35" transform="translate(-2 -2)"/>
</g>
<g fill="#6B4226" opacity=".55">${covinhas.join('')}</g>
${usar(S.capim, 150, 610, 132, 99)}
${usar(S.capim, 318, 706, 96, 72)}
${usar(S.capim, 1010, 742, 110, 82)}
${usar(S.foco, foco.x, foco.y, foco.t)}
<g opacity=".8">${usar(S.fumaca, foco.x + 34, foco.y - 128, 150)}</g>
${caes.map((c) => sombra(c.x, c.y, c.t) + usar(c.s, c.x, c.y, c.t)).join('')}
${sombra(onca.x, onca.y, onca.t)}${usar(S.onca, onca.x, onca.y, onca.t)}
</svg>
`;

writeFileSync(raiz + 'capa/capa.svg', svg.replace(/\n/g, ''));
console.log('capa/capa.svg', (Buffer.byteLength(svg) / 1024).toFixed(1), 'KB');
