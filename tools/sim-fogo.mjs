// Simulador de ritmo do fogo — Adugo: Território da Onça
// Uso: node tools/sim-fogo.mjs
//
// Serve para calibrar os números de docs/MECANICAS.md (seção "Ritmo").
// Os dois lados são bots heurísticos simples. O bot dos cachorros é fraco
// (quase nunca fecha o cerco), então este script mede o RITMO DO FOGO
// (quantos focos, quantos queimam, quando a partida acaba), e NÃO o
// equilíbrio onça x cachorros. Para isso é preciso um bot com busca.

// ---------- Tabuleiro: 31 pontos definidos pelas linhas ----------
const key = (r, c) => `${r},${c}`;
const LINHAS = [];
for (let r = 0; r < 5; r++) LINHAS.push([0, 1, 2, 3, 4].map((c) => key(r, c)));
for (let c = 0; c < 5; c++) if (c !== 2) LINHAS.push([0, 1, 2, 3, 4].map((r) => key(r, c)));
LINHAS.push([0, 1, 2, 3, 4, 5, 6].map((r) => key(r, 2))); // coluna central entra na toca
LINHAS.push([0, 1, 2, 3, 4].map((i) => key(i, i)));
LINHAS.push([0, 1, 2, 3, 4].map((i) => key(i, 4 - i)));
LINHAS.push(['0,2', '1,1', '2,0']);
LINHAS.push(['0,2', '1,3', '2,4']);
LINHAS.push(['2,0', '3,1', '4,2', '5,3', '6,4']); // diagonal que vira lado da toca
LINHAS.push(['2,4', '3,3', '4,2', '5,1', '6,0']); // diagonal que vira lado da toca
LINHAS.push(['5,1', '5,2', '5,3']);
LINHAS.push(['6,0', '6,2', '6,4']);

const PONTOS = [...new Set(LINHAS.flat())];
const VIZ = {};
const PULOS = {};
for (const p of PONTOS) { VIZ[p] = new Set(); PULOS[p] = []; }
for (const L of LINHAS) {
  for (let i = 0; i < L.length; i++) {
    if (i + 1 < L.length) { VIZ[L[i]].add(L[i + 1]); VIZ[L[i + 1]].add(L[i]); }
    if (i + 2 < L.length) { PULOS[L[i]].push([L[i + 1], L[i + 2]]); PULOS[L[i + 2]].push([L[i + 1], L[i]]); }
  }
}
const TOCA = new Set(['5,1', '5,2', '5,3', '6,0', '6,2', '6,4']);
const BORDA = new Set(PONTOS.filter((p) => { const [r, c] = p.split(',').map(Number); return r <= 4 && (r === 0 || r === 4 || c === 0 || c === 4); }));
if (PONTOS.length !== 31) throw new Error(`esperava 31 pontos, achei ${PONTOS.length}`);

// ---------- Aleatoriedade com semente ----------
let semente = 20261115;
const rnd = () => { semente = (semente * 1664525 + 1013904223) >>> 0; return semente / 4294967296; };
const sorteia = (a) => a[Math.floor(rnd() * a.length)];

// ---------- Estado e regras ----------
function novoEstado() {
  const caes = new Set();
  for (let c = 0; c < 5; c++) { caes.add(key(0, c)); caes.add(key(1, c)); if (c !== 2) caes.add(key(2, c)); }
  return { onca: '2,2', caes, queimados: new Set(), foco: null, ttl: 0, capturas: 0, focos: 0, apagados: 0 };
}
const livre = (s, p) => p !== s.onca && !s.caes.has(p) && !s.queimados.has(p);
const passosOnca = (s) => [...VIZ[s.onca]].filter((p) => livre(s, p));
const capturasOnca = (s) => PULOS[s.onca].filter(([sobre, pouso]) => s.caes.has(sobre) && livre(s, pouso));
// O fogo "ajudou o cerco" se a onça teria jogada caso os pontos queimados estivessem vazios.
function fogoAjudouCerco(s) {
  const semFogo = { ...s, queimados: new Set() };
  return passosOnca(semFogo).length > 0 || capturasOnca(semFogo).length > 0;
}
const ocupa = (s, p) => { if (s.foco === p) { s.foco = null; s.apagados++; } };

function vezDaOnca(s, P) {
  let caps = capturasOnca(s);
  if (caps.length) {
    while (caps.length && s.capturas < 5) {
      const [sobre, pouso] = sorteia(caps);
      s.caes.delete(sobre); s.onca = pouso; s.capturas++; ocupa(s, pouso);
      caps = capturasOnca(s);
    }
    return true;
  }
  const passos = passosOnca(s);
  if (!passos.length) return false;
  if (s.foco && passos.includes(s.foco) && rnd() < P.oncaApaga) { s.onca = s.foco; ocupa(s, s.onca); return true; }
  let melhor = null, nota = -Infinity;
  for (const p of passos) {
    const antes = s.onca; s.onca = p;
    const n = capturasOnca(s).length * 3 + passosOnca(s).length + rnd() * 0.5;
    s.onca = antes;
    if (n > nota) { nota = n; melhor = p; }
  }
  s.onca = melhor;
  return true;
}

function vezDosCaes(s, P) {
  const jogadas = [];
  for (const d of s.caes) for (const p of VIZ[d]) if (livre(s, p)) jogadas.push([d, p]);
  if (!jogadas.length) return false;
  const [or, oc] = s.onca.split(',').map(Number);
  let melhor = null, nota = -Infinity;
  for (const [d, p] of jogadas) {
    s.caes.delete(d); s.caes.add(p);
    const ameacas = capturasOnca(s).length, mob = passosOnca(s).length;
    const [r, c] = p.split(',').map(Number);
    let n = -ameacas * 10 - mob * 2 - (Math.abs(r - or) + Math.abs(c - oc)) * 0.3 + rnd() * 1.5;
    if (ameacas === 0 && mob === 0 && !fogoAjudouCerco(s)) n += 1000; // cerco limpo
    if (ameacas === 0 && mob === 0 && fogoAjudouCerco(s)) n -= 1000; // cerco com fogo: ninguém vence
    if (s.foco === p && rnd() < P.caesApagam) n += 6;
    else if (s.foco && VIZ[p].has(s.foco) && !VIZ[d].has(s.foco)) n += 2;
    s.caes.delete(p); s.caes.add(d);
    if (n > nota) { nota = n; melhor = [d, p]; }
  }
  s.caes.delete(melhor[0]); s.caes.add(melhor[1]); ocupa(s, melhor[1]);
  return true;
}

// Foco nasce em ponto vazio, fora da toca, que alguma peça alcança em até `aviso` jogadas
// por caminho livre. Peso maior na borda e ao lado de ponto já queimado.
function nasceFoco(s, P) {
  const pecas = [s.onca, ...s.caes];
  const alcancavel = new Set();
  let fronteira = pecas;
  for (let passo = 0; passo < P.aviso; passo++) {
    const prox = [];
    for (const q of fronteira) for (const p of VIZ[q]) if (livre(s, p) && !alcancavel.has(p)) { alcancavel.add(p); prox.push(p); }
    fronteira = prox;
  }
  const cand = [...alcancavel].filter((p) => !TOCA.has(p));
  if (!cand.length) return;
  const peso = cand.map((p) => 1 + (BORDA.has(p) ? P.pesoBorda : 0) + ([...VIZ[p]].some((q) => s.queimados.has(q)) ? P.pesoVizinhoQueimado : 0));
  let t = rnd() * peso.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cand.length; i++) { t -= peso[i]; if (t <= 0) { s.foco = cand[i]; break; } }
  s.ttl = P.aviso; s.focos++;
}
function rodadaDeFoco(r, P) {
  if (!P.fogo || r < P.primeiro) return false;
  if (r < P.aceleraEm) return (r - P.primeiro) % P.intervalo === 0;
  return (r - P.aceleraEm) % P.intervaloFinal === 0;
}

function partida(P) {
  const s = novoEstado();
  for (let r = 1; r <= P.maxRodadas; r++) {
    if (rodadaDeFoco(r, P) && !s.foco) nasceFoco(s, P);
    if (!vezDaOnca(s, P)) return { fim: fogoAjudouCerco(s) ? 'cercoComFogo' : 'caes', r, s };
    if (s.capturas >= 5) return { fim: 'onca', r, s };
    if (!vezDosCaes(s, P)) return { fim: 'empate', r, s };
    if (!passosOnca(s).length && !capturasOnca(s).length) return { fim: fogoAjudouCerco(s) ? 'cercoComFogo' : 'caes', r, s };
    if (s.foco && --s.ttl <= 0) {
      s.queimados.add(s.foco); s.foco = null;
      if (s.queimados.size >= P.limite) return { fim: 'territorio', r, s };
    }
  }
  return { fim: 'empate', r: P.maxRodadas, s };
}

function roda(rotulo, P, n = 4000) {
  const fins = {}; let R = 0, F = 0, Q = 0, A = 0; const dur = [];
  for (let i = 0; i < n; i++) {
    const g = partida(P);
    fins[g.fim] = (fins[g.fim] || 0) + 1; R += g.r; F += g.s.focos; Q += g.s.queimados.size; A += g.s.apagados; dur.push(g.r);
  }
  dur.sort((a, b) => a - b);
  const pct = (k) => `${Math.round(((fins[k] || 0) / n) * 100)}%`.padStart(4);
  console.log(
    rotulo.padEnd(46),
    `onça ${pct('onca')} | cães ${pct('caes')} | território ${pct('territorio')} | cerco+fogo ${pct('cercoComFogo')} | empate ${pct('empate')}`,
    `| rodadas ${(R / n).toFixed(0)} (p10 ${dur[Math.floor(n * 0.1)]}, p90 ${dur[Math.floor(n * 0.9)]})`,
    `| focos ${(F / n).toFixed(1)} apagados ${(A / n).toFixed(1)} queimados ${(Q / n).toFixed(1)}`,
  );
}

const PADRAO = {
  fogo: true, aviso: 2, primeiro: 4, intervalo: 4, aceleraEm: 24, intervaloFinal: 3, limite: 5,
  pesoBorda: 1, pesoVizinhoQueimado: 2, maxRodadas: 100, oncaApaga: 0.5, caesApagam: 0.8,
};

console.log('--- clássico (sem fogo) ---');
roda('clássico', { ...PADRAO, fogo: false });
console.log('\n--- proposta original: foco a cada 2 rodadas, queima na rodada seguinte, limite 6 ---');
roda('original', { ...PADRAO, aviso: 1, primeiro: 2, intervalo: 2, aceleraEm: 1e9, limite: 6 });
console.log('\n--- configuração adotada, variando o cuidado dos jogadores ---');
for (const caesApagam of [0.5, 0.8, 1]) roda(`adotada | cães apagam ${caesApagam}`, { ...PADRAO, caesApagam });
console.log('\n--- vizinhança da configuração adotada (cães apagam 0.8) ---');
roda('aviso 1', { ...PADRAO, aviso: 1 });
roda('aviso 3', { ...PADRAO, aviso: 3 });
roda('intervalo 3', { ...PADRAO, intervalo: 3 });
roda('intervalo 5', { ...PADRAO, intervalo: 5 });
roda('limite 4', { ...PADRAO, limite: 4 });
roda('limite 6', { ...PADRAO, limite: 6 });
roda('sem aceleração', { ...PADRAO, aceleraEm: 1e9 });
roda('primeiro foco na rodada 2', { ...PADRAO, primeiro: 2 });
roda('primeiro foco na rodada 6', { ...PADRAO, primeiro: 6 });
