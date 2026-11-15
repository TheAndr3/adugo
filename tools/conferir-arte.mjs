// Confere se todo SVG segue as regras de docs/ESTETICA.md (seções 2, 5.1 e 5.2).
// Uso: npm run arte:conferir   (sai com erro se algum asset estiver fora da regra)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

const PALETA = new Set(
  [...readFileSync(`${raiz}src/estilos/tokens.css`, 'utf8').matchAll(/--[\w-]+:\s*(#[0-9a-f]{6})/gi)].map((m) =>
    m[1].toUpperCase(),
  ),
);

// arquivo -> [viewBox, peso máximo em KB]
const ESPERADO = {
  'src/arte/pecas/cachorro-a.svg': ['0 0 64 64', 2],
  'src/arte/pecas/cachorro-b.svg': ['0 0 64 64', 2],
  'src/arte/pecas/cachorro-c.svg': ['0 0 64 64', 2],
  'src/arte/pecas/onca.svg': ['0 0 80 80', 4],
  'src/arte/fogo/foco.svg': ['0 0 96 96', 4],
  'src/arte/fogo/queimado.svg': ['0 0 120 120', 4],
  'src/arte/fogo/fumaca.svg': ['0 0 96 96', 2],
  'src/arte/fogo/broto.svg': ['0 0 48 48', 1.5],
  'src/arte/chao/chao.svg': ['0 0 512 512', 3],
  'src/arte/chao/capim.svg': ['0 0 64 48', 2],
  'src/arte/marca/adugo.svg': ['0 0 640 200', 8],
  'src/arte/capa/capa.svg': ['0 0 1200 900', 40],
  'public/favicon.svg': ['0 0 64 64', 2],
};
const ICONES = ['pata-onca', 'pata-cachorro', 'chama', 'broto', 'regras', 'reiniciar', 'trocar', 'voltar', 'fechar', 'sobre'];
for (const nome of ICONES) ESPERADO[`src/arte/icones/${nome}.svg`] = ['0 0 24 24', 1];

function listarSvg(pasta) {
  return readdirSync(raiz + pasta).flatMap((nome) => {
    const caminho = `${pasta}/${nome}`;
    if (statSync(raiz + caminho).isDirectory()) return listarSvg(caminho);
    return nome.endsWith('.svg') ? [caminho] : [];
  });
}

const problemas = [];
const encontrados = [...listarSvg('src/arte'), 'public/favicon.svg'];

for (const caminho of Object.keys(ESPERADO)) {
  if (!encontrados.includes(caminho)) problemas.push(`${caminho}: arquivo não existe`);
}

for (const caminho of encontrados) {
  const erro = (texto) => problemas.push(`${caminho}: ${texto}`);
  const svg = readFileSync(raiz + caminho, 'utf8');
  const nome = caminho.split('/').pop().replace('.svg', '');
  const abertura = svg.match(/^<svg([^>]*)>/)?.[1];
  if (abertura === undefined) {
    erro('não começa com <svg>');
    continue;
  }

  const esperado = ESPERADO[caminho];
  if (!esperado) erro('não está no inventário da seção 5.2');
  else {
    const [viewBox, kb] = esperado;
    if (abertura.match(/viewBox="([^"]+)"/)?.[1] !== viewBox) erro(`viewBox deveria ser "${viewBox}"`);
    const peso = Buffer.byteLength(svg) / 1024;
    if (peso > kb) erro(`pesa ${peso.toFixed(2)} KB, o limite é ${kb} KB`);
  }

  if (/\s(width|height)="/.test(abertura)) erro('tem width ou height fixo na raiz');
  for (const proibido of ['<text', '<image', '<script', '<foreignObject', '<style', '<font']) {
    if (svg.includes(proibido)) erro(`contém ${proibido}>`);
  }
  if (/(href|src)="(?!#)/.test(svg)) erro('tem referência externa');
  if (/feTurbulence/.test(svg) && nome !== 'chao') erro('feTurbulence só é permitido no ladrilho do chão');
  if (/stroke="url\(/.test(svg)) erro('degradê em traço trava o desenho no navegador');
  if (/feDropShadow|feGaussianBlur/.test(svg)) erro('tem sombra ou desfoque embutido');

  for (const [, id] of svg.matchAll(/\sid="([^"]+)"/g)) {
    if (!id.startsWith(`${nome}-`)) erro(`id "${id}" deveria começar com "${nome}-"`);
  }
  for (const [cor] of svg.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b(?![0-9a-f])/gi)) {
    if (!PALETA.has(cor.toUpperCase())) erro(`cor ${cor} não é da paleta`);
  }
  if (caminho.includes('/icones/') && !svg.includes('currentColor')) erro('ícone deveria usar currentColor');
}

if (problemas.length > 0) {
  console.error(`${problemas.length} problema(s):\n` + problemas.map((p) => `  ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${encontrados.length} SVGs conferidos: viewBox, peso, ids, cores da paleta e itens proibidos. Tudo certo.`);
