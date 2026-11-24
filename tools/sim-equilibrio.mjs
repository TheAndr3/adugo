// Simulador de equilíbrio (issue 8): bots com busca jogam milhares de partidas com o motor
// oficial (src/motor) e o resultado sai como tabela em Markdown.
// Os bots NÃO entram no jogo; a interface é só para duas pessoas.
//
// Uso:
//   npm run sim:equilibrio                         # bateria do relatório
//   npm run sim:equilibrio -- --grupo calibrar     # variações de pesos dos bots
//   npm run sim:equilibrio -- --partidas 100       # menos partidas por linha
//
// Roda em paralelo, uma thread por núcleo menos um. Cada linha da tabela usa as mesmas
// sementes, então duas linhas comparam as mesmas partidas com uma regra diferente.

import { register } from 'node:module';
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

register('./resolver-ts.mjs', import.meta.url);

const raiz = new URL('../', import.meta.url);

if (!isMainThread) {
  const { jogarPartida } = await import(new URL('src/simulacao/simular.ts', raiz).href);
  parentPort.on('message', (tarefa) => {
    const inicio = performance.now();
    const resumo = jogarPartida(tarefa.opcoes);
    parentPort.postMessage({ id: tarefa.id, resumo, ms: performance.now() - inicio });
  });
} else {
  await principal();
}

async function principal() {
  const { CONFIG } = await import(new URL('src/motor/config.ts', raiz).href);
  const { PERFIL_FORTE, PERFIL_HUMANO, PESOS_PADRAO } = await import(new URL('src/simulacao/bots.ts', raiz).href);

  const args = process.argv.slice(2);
  const valor = (nome, padrao) => {
    const i = args.indexOf(`--${nome}`);
    return i >= 0 ? args[i + 1] : padrao;
  };
  const partidas = Number(valor('partidas', 300));
  const grupo = valor('grupo', 'relatorio');

  const fogo = (mudancas) => ({ ...CONFIG, fogo: { ...CONFIG.fogo, ...mudancas } });
  const perfil = (base, mudancas = {}) => ({ ...base, ...mudancas, pesos: { ...base.pesos, ...(mudancas.pesos ?? {}) } });
  const humano = PERFIL_HUMANO;
  const forte = PERFIL_FORTE;

  const EXPERIMENTOS = {
    relatorio: [
      { nome: 'Clássico, bots fortes', modo: 'classico', onca: forte, caes: forte },
      { nome: 'Território, bots fortes', modo: 'territorio', onca: forte, caes: forte },
      { nome: 'Clássico, bots "humanos"', modo: 'classico', onca: humano, caes: humano },
      { nome: 'Território, bots "humanos"', modo: 'territorio', onca: humano, caes: humano },
      { nome: 'Território, bots "humanos" que ignoram o fogo', modo: 'territorio', onca: perfil(humano, { pesoFogo: 0 }), caes: perfil(humano, { pesoFogo: 0 }) },
    ],
    sensibilidade: [
      { nome: 'Território, aviso 1', modo: 'territorio', onca: humano, caes: humano, config: fogo({ aviso: 1 }) },
      { nome: 'Território, aviso 3', modo: 'territorio', onca: humano, caes: humano, config: fogo({ aviso: 3 }) },
      { nome: 'Território, limite 4', modo: 'territorio', onca: humano, caes: humano, config: fogo({ limiteQueimados: 4 }) },
      { nome: 'Território, limite 6', modo: 'territorio', onca: humano, caes: humano, config: fogo({ limiteQueimados: 6 }) },
      { nome: 'Território, foco a cada 3', modo: 'territorio', onca: humano, caes: humano, config: fogo({ intervalo: 3 }) },
    ],
    calibrar: [
      { nome: 'sem aprofundar no fim', modo: 'classico', onca: perfil(humano, { fimDeCerco: 0 }), caes: perfil(humano, { fimDeCerco: 0 }) },
      { nome: '+2 no fim do cerco', modo: 'classico', onca: humano, caes: humano },
      { nome: '+3 no fim do cerco', modo: 'classico', onca: perfil(humano, { fimDeCerco: 3 }), caes: perfil(humano, { fimDeCerco: 3 }) },
      { nome: '+2, aproximação 30', modo: 'classico', onca: perfil(humano, { pesos: { aproximacao: 30 } }), caes: perfil(humano, { pesos: { aproximacao: 30 } }) },
    ],
  };

  const lista = EXPERIMENTOS[grupo];
  if (!lista) throw new Error(`Grupo desconhecido: ${grupo}. Use: ${Object.keys(EXPERIMENTOS).join(', ')}`);

  const tarefas = [];
  lista.forEach((exp, e) => {
    for (let s = 1; s <= partidas; s++) {
      tarefas.push({
        id: tarefas.length,
        experimento: e,
        opcoes: { modo: exp.modo, semente: s * 7919, onca: exp.onca, caes: exp.caes, config: exp.config ?? CONFIG },
      });
    }
  });

  const threads = Math.max(1, availableParallelism() - 1);
  const resultados = new Array(tarefas.length);
  let proxima = 0;
  let prontas = 0;
  const inicio = performance.now();

  await new Promise((resolver, rejeitar) => {
    const trabalhadores = [];
    const enviar = (w) => {
      if (proxima < tarefas.length) w.postMessage(tarefas[proxima++]);
    };
    for (let i = 0; i < Math.min(threads, tarefas.length); i++) {
      const w = new Worker(new URL(import.meta.url));
      trabalhadores.push(w);
      w.on('error', rejeitar);
      w.on('message', ({ id, resumo }) => {
        resultados[id] = resumo;
        prontas++;
        if (prontas % 50 === 0 || prontas === tarefas.length) {
          process.stderr.write(`\r${prontas}/${tarefas.length} partidas`);
        }
        if (prontas === tarefas.length) {
          trabalhadores.forEach((t) => t.terminate());
          resolver();
        } else {
          enviar(w);
        }
      });
      enviar(w);
    }
  });
  process.stderr.write(`\n${((performance.now() - inicio) / 1000).toFixed(0)} s em ${threads} threads\n\n`);

  const pct = (n, total) => `${Math.round((100 * n) / total)}%`;
  const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const fmt = (x) => x.toFixed(1).replace('.', ',');

  console.log(`Grupo **${grupo}**, ${partidas} partidas por linha, mesmas sementes em todas as linhas.\n`);
  console.log('| Configuração | Onça vence | Cachorros vencem | Território destruído | Cerco com fogo | Empate | Rodadas (média) | Capturas | Focos | Apagados onça / cães | Queimados | Partidas com pulo fechado pelo fogo |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  lista.forEach((exp, e) => {
    const rs = tarefas.filter((t) => t.experimento === e).map((t) => resultados[t.id]);
    const conta = (tipo) => rs.filter((r) => r.resultado.tipo === tipo).length;
    const empates = rs.filter((r) => r.resultado.tipo === 'empate');
    const motivos = ['repeticao', 'limiteDeRodadas', 'caesSemJogada']
      .map((m) => [m, empates.filter((r) => r.resultado.motivo === m).length])
      .filter(([, n]) => n > 0)
      .map(([m, n]) => `${{ repeticao: 'repetição', limiteDeRodadas: '100 rodadas', caesSemJogada: 'sem jogada' }[m]} ${pct(n, rs.length)}`)
      .join(', ');
    const comFogo = exp.modo === 'territorio';
    console.log(
      `| ${exp.nome} | ${pct(conta('onca'), rs.length)} | ${pct(conta('caes'), rs.length)} | ${comFogo ? pct(conta('territorio'), rs.length) : '—'} | ${comFogo ? pct(conta('cercoComFogo'), rs.length) : '—'} | ${pct(empates.length, rs.length)}${motivos ? ` (${motivos})` : ''} | ${fmt(media(rs.map((r) => r.rodadas)))} | ${fmt(media(rs.map((r) => r.capturas)))} | ${comFogo ? fmt(media(rs.map((r) => r.focos))) : '—'} | ${comFogo ? `${fmt(media(rs.map((r) => r.apagadosOnca)))} / ${fmt(media(rs.map((r) => r.apagadosCaes)))}` : '—'} | ${comFogo ? fmt(media(rs.map((r) => r.queimados))) : '—'} | ${comFogo ? pct(rs.filter((r) => r.pulosBloqueados > 0).length, rs.length) : '—'} |`,
    );
  });
}
