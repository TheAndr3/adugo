// Assets do jogo como componentes React (docs/ESTETICA.md, seção 5).
// Cada um é um <svg> que aceita as props normais de SVG (width, height, x, y, className…).
import './arte.css';

import CachorroA from './pecas/cachorro-a.svg?react';
import CachorroB from './pecas/cachorro-b.svg?react';
import CachorroC from './pecas/cachorro-c.svg?react';

export { CachorroA, CachorroB, CachorroC };
export { default as Onca } from './pecas/onca.svg?react';

export { default as Foco } from './fogo/foco.svg?react';
export { default as Queimado } from './fogo/queimado.svg?react';
export { default as Fumaca } from './fogo/fumaca.svg?react';
export { default as Broto } from './fogo/broto.svg?react';

export { default as Capim } from './chao/capim.svg?react';
export { default as Logotipo } from './marca/adugo.svg?react';

export { default as IconePataOnca } from './icones/pata-onca.svg?react';
export { default as IconePataCachorro } from './icones/pata-cachorro.svg?react';
export { default as IconeChama } from './icones/chama.svg?react';
export { default as IconeBroto } from './icones/broto.svg?react';
export { default as IconeRegras } from './icones/regras.svg?react';
export { default as IconeReiniciar } from './icones/reiniciar.svg?react';
export { default as IconeTrocar } from './icones/trocar.svg?react';
export { default as IconeVoltar } from './icones/voltar.svg?react';
export { default as IconeFechar } from './icones/fechar.svg?react';
export { default as IconeSobre } from './icones/sobre.svg?react';
export { default as IconePausar } from './icones/pausar.svg?react';

/** As três variantes de seixo. Cada cachorro usa sempre a mesma, pelo seu índice. */
export const CACHORROS = [CachorroA, CachorroB, CachorroC] as const;
