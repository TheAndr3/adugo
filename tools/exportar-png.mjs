// Exporta as imagens de public/ a partir dos SVG (docs/ESTETICA.md, seção 5.2).
// Nenhuma imagem é desenhada à parte. Uso: npm run arte:png

import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const arte = `${raiz}src/arte/`;
const publico = `${raiz}public/`;

// Ícones de atalho: o favicon em 192, 512 e 180 px.
for (const [arquivo, lado] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(`${publico}favicon.svg`, { density: (72 * lado) / 64 })
    .resize(lado, lado)
    .flatten({ background: '#E0BE8E' }) // sem cantos transparentes: o sistema recorta do jeito dele
    .png({ compressionLevel: 9 })
    .toFile(publico + arquivo);
  console.log(arquivo);
}

// Prévia do link (1200 × 630): chão, capa por cima e o logotipo no canto livre.
// Sai em JPEG: a textura granulada do chão passa de 400 KB em PNG, acima do que os
// aplicativos de mensagem aceitam para a prévia.
const LARGURA = 1200;
const ALTURA = 630;
// O chão é desenhado de uma vez no tamanho final: repetir o ladrilho aqui deixava emendas,
// porque o conversor não respeita o stitchTiles do filtro como o navegador.
const chao = (await import('node:fs'))
  .readFileSync(`${arte}chao/chao.svg`, 'utf8')
  .replace('viewBox="0 0 512 512"', `viewBox="0 0 ${LARGURA} ${ALTURA}" width="${LARGURA}" height="${ALTURA}"`)
  .replaceAll('width="512" height="512"', `width="${LARGURA}" height="${ALTURA}"`);
const fundo = await sharp(Buffer.from(chao)).png().toBuffer();
const capa = await sharp(`${arte}capa/capa.svg`, { density: 72 })
  .resize(LARGURA, 900)
  .extract({ left: 0, top: 0, width: LARGURA, height: ALTURA })
  .png()
  .toBuffer();
const logo = await sharp(`${arte}marca/adugo.svg`, { density: 72 }).resize(400).png().toBuffer();

await sharp({ create: { width: LARGURA, height: ALTURA, channels: 3, background: '#E0BE8E' } })
  .composite([
    { input: fundo, left: 0, top: 0 },
    { input: capa, left: 0, top: 0 },
    { input: logo, left: 36, top: 440 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(`${publico}og.jpg`);
console.log('og.jpg');
