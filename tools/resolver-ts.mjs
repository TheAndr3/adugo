// Gancho de resolução para o Node rodar o código TypeScript de src/ direto, sem compilar.
// O Node 24 já remove os tipos sozinho; só não acha imports sem extensão ('./motor'),
// que o Vite e o Vitest aceitam. Aqui eles viram './motor.ts' ou './motor/index.ts'.
// Uso: import { register } from 'node:module'; register('./resolver-ts.mjs', import.meta.url);

import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(especificador, contexto, proximo) {
  const relativo = especificador.startsWith('./') || especificador.startsWith('../');
  const temExtensao = /\.[cm]?[jt]sx?$|\.json$/.test(especificador);
  if (relativo && !temExtensao && contexto.parentURL?.endsWith('.ts')) {
    const base = new URL(especificador, contexto.parentURL);
    for (const candidato of [`${base.href}.ts`, `${base.href}/index.ts`]) {
      const caminho = fileURLToPath(candidato);
      if (existsSync(caminho) && statSync(caminho).isFile()) return proximo(candidato, contexto);
    }
  }
  return proximo(especificador, contexto);
}
