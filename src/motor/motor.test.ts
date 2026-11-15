import { describe, expect, it } from 'vitest';
import {
  BORDA,
  CONFIG,
  PONTOS,
  PULOS,
  TOCA,
  VIZINHOS,
  aplicar,
  criarEstado,
  fogoAjudouCerco,
  jogadasPossiveis,
  livre,
  novaPartida,
  ponto as P,
  proximoFocoEm,
  rodadaDeFoco,
  type Config,
  type Estado,
  type Evento,
  type Jogada,
  type Ponto,
} from './index';

const mover = (de: Ponto, para: Ponto): Jogada => ({ tipo: 'mover', de, para });
const pular = (de: Ponto, sobre: Ponto, para: Ponto): Jogada => ({ tipo: 'pular', de, sobre, para });

function seguir(estado: Estado, ...jogadas: Jogada[]): { estado: Estado; eventos: Evento[] } {
  let s = estado;
  const eventos: Evento[] = [];
  for (const j of jogadas) {
    const passo = aplicar(s, j);
    s = passo.estado;
    eventos.push(...passo.eventos);
  }
  return { estado: s, eventos };
}

function congelar<T>(valor: T): T {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const v of Object.values(valor)) congelar(v);
  }
  return valor;
}

const comFogo = (fogo: Partial<Config['fogo']>, resto: Partial<Config> = {}): Config => ({
  ...CONFIG,
  ...resto,
  fogo: { ...CONFIG.fogo, ...fogo },
});

const destinos = (s: Estado): Ponto[] =>
  jogadasPossiveis(s).flatMap((j) => (j.tipo === 'encerrar' ? [] : [j.para]));

describe('tabuleiro', () => {
  it('tem 31 pontos, 66 ligações e 96 pulos com direção', () => {
    expect(PONTOS).toHaveLength(31);
    const graus = PONTOS.map((p) => VIZINHOS[p]!.length);
    expect(graus.reduce((a, b) => a + b, 0) / 2).toBe(66);
    expect(PONTOS.map((p) => PULOS[p]!.length).reduce((a, b) => a + b, 0)).toBe(96);
  });

  it('tem os graus esperados nos pontos de referência', () => {
    expect(VIZINHOS[P(2, 2)]).toHaveLength(8);
    expect(VIZINHOS[P(4, 2)]).toHaveLength(8);
    expect(VIZINHOS[P(0, 0)]).toHaveLength(3);
    expect(VIZINHOS[P(1, 0)]).toHaveLength(3);
    expect(VIZINHOS[P(5, 2)]).toHaveLength(4);
    expect(VIZINHOS[P(6, 0)]).toHaveLength(2);
    expect(VIZINHOS[P(6, 2)]).toHaveLength(3);
  });

  it('não repete vizinhos e a vizinhança vale nos dois sentidos', () => {
    for (const p of PONTOS) {
      expect(new Set(VIZINHOS[p]).size).toBe(VIZINHOS[p]!.length);
      for (const v of VIZINHOS[p]!) expect(VIZINHOS[v]).toContain(p);
    }
  });

  it('só tem diagonais nos pontos de soma par', () => {
    expect(VIZINHOS[P(0, 1)]).not.toContain(P(1, 0));
    expect(VIZINHOS[P(0, 1)]).not.toContain(P(1, 2));
    expect(VIZINHOS[P(1, 1)]).toContain(P(0, 0));
    expect(VIZINHOS[P(1, 1)]).toContain(P(2, 2));
  });

  it('todo pulo passa por um vizinho e cai no vizinho seguinte', () => {
    for (const p of PONTOS) {
      for (const { sobre, pouso } of PULOS[p]!) {
        expect(VIZINHOS[p]).toContain(sobre);
        expect(VIZINHOS[sobre]).toContain(pouso);
        expect(pouso).not.toBe(p);
      }
    }
  });

  it('liga a grade à toca em linha reta', () => {
    expect(PULOS[P(3, 3)]).toContainEqual({ sobre: P(4, 2), pouso: P(5, 1) });
    expect(PULOS[P(3, 2)]).toContainEqual({ sobre: P(4, 2), pouso: P(5, 2) });
    expect(PULOS[P(6, 0)]).toContainEqual({ sobre: P(6, 2), pouso: P(6, 4) });
  });

  it('tem 6 pontos de toca e 16 de borda, sem sobreposição', () => {
    expect(TOCA.size).toBe(6);
    expect(BORDA.size).toBe(16);
    for (const p of TOCA) expect(BORDA.has(p)).toBe(false);
    expect(BORDA.has(P(4, 2))).toBe(true);
  });
});

describe('posição inicial', () => {
  const { estado, eventos } = novaPartida({ modo: 'classico', semente: 1 });

  it('põe a onça no centro e 14 cachorros na metade oposta à toca', () => {
    expect(estado.onca).toBe(P(2, 2));
    expect(estado.caes).toHaveLength(14);
    expect(new Set(estado.caes).size).toBe(14);
    for (const c of estado.caes) {
      const r = Number(c!.split(',')[0]);
      expect(r).toBeLessThanOrEqual(2);
    }
    expect(estado.caes).not.toContain(P(2, 2));
  });

  it('começa na rodada 1 com a onça a jogar', () => {
    expect(estado.rodada).toBe(1);
    expect(estado.vez).toBe('onca');
    expect(estado.resultado).toBeNull();
    expect(eventos).toEqual([{ tipo: 'rodadaComecou', rodada: 1 }]);
  });

  it('dá à onça só os três passos para a frente, sem captura', () => {
    expect(jogadasPossiveis(estado)).toHaveLength(3);
    expect(destinos(estado).sort()).toEqual([P(3, 1), P(3, 2), P(3, 3)]);
  });

  it('deixa os cachorros andar em qualquer direção, sem capturar', () => {
    const s = aplicar(estado, mover(P(2, 2), P(3, 2))).estado;
    expect(s.vez).toBe('caes');
    const jogadas = jogadasPossiveis(s);
    expect(jogadas.every((j) => j.tipo === 'mover')).toBe(true);
    expect(jogadas).toContainEqual(mover(P(2, 1), P(2, 2)));
    expect(jogadas).toContainEqual(mover(P(2, 0), P(3, 0)));
    expect(jogadas).toContainEqual(mover(P(1, 2), P(2, 2)));
  });
});

describe('movimento', () => {
  it('recusa jogada ilegal', () => {
    const { estado } = novaPartida({ modo: 'classico', semente: 1 });
    expect(() => aplicar(estado, mover(P(2, 2), P(4, 2)))).toThrow(/inválida/);
    expect(() => aplicar(estado, mover(P(2, 1), P(3, 1)))).toThrow(/inválida/);
    expect(() => aplicar(estado, { tipo: 'encerrar' })).toThrow(/inválida/);
  });

  it('não altera o estado recebido', () => {
    const { estado } = novaPartida({ modo: 'territorio', semente: 7 });
    congelar(estado);
    const depois = aplicar(estado, mover(P(2, 2), P(3, 2))).estado;
    expect(estado.onca).toBe(P(2, 2));
    expect(depois.onca).toBe(P(3, 2));
  });

  it('mantém a identidade de cada cachorro pelo índice', () => {
    const { estado } = novaPartida({ modo: 'classico', semente: 1 });
    const { estado: s, eventos } = seguir(estado, mover(P(2, 2), P(3, 2)), mover(P(2, 0), P(3, 0)));
    expect(s.caes[10]).toBe(P(3, 0));
    expect(eventos).toContainEqual({ tipo: 'moveu', lado: 'caes', cao: 10, de: P(2, 0), para: P(3, 0) });
  });
});

describe('captura', () => {
  it('a onça pula um cachorro vizinho e ele sai do jogo', () => {
    const s0 = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0)] });
    expect(jogadasPossiveis(s0)).toContainEqual(pular(P(2, 2), P(2, 3), P(2, 4)));
    const { estado, eventos } = aplicar(s0, pular(P(2, 2), P(2, 3), P(2, 4)));
    expect(estado.onca).toBe(P(2, 4));
    expect(estado.caes).toEqual([null, P(0, 0)]);
    expect(estado.capturas).toBe(1);
    expect(estado.vez).toBe('caes');
    expect(eventos[0]).toEqual({ tipo: 'capturou', cao: 0, de: P(2, 2), sobre: P(2, 3), para: P(2, 4) });
  });

  it('não é obrigatória', () => {
    const s0 = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0)] });
    expect(jogadasPossiveis(s0)).toContainEqual(mover(P(2, 2), P(3, 2)));
  });

  it('não acontece se o pouso está ocupado ou queimado', () => {
    const ocupado = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(2, 4)] });
    expect(jogadasPossiveis(ocupado).some((j) => j.tipo === 'pular')).toBe(false);
    const queimado = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0)], queimados: [P(2, 4)] });
    expect(jogadasPossiveis(queimado).some((j) => j.tipo === 'pular')).toBe(false);
  });

  it('em cadeia: a onça pode pular de novo ou encerrar', () => {
    const s0 = criarEstado({ onca: P(2, 0), caes: [P(2, 1), P(2, 3), P(0, 4)] });
    const s1 = aplicar(s0, pular(P(2, 0), P(2, 1), P(2, 2))).estado;
    expect(s1.vez).toBe('onca');
    expect(s1.emCadeia).toBe(true);
    expect(jogadasPossiveis(s1)).toEqual([pular(P(2, 2), P(2, 3), P(2, 4)), { tipo: 'encerrar' }]);

    const encerrou = aplicar(s1, { tipo: 'encerrar' }).estado;
    expect(encerrou.vez).toBe('caes');
    expect(encerrou.capturas).toBe(1);

    const continuou = aplicar(s1, pular(P(2, 2), P(2, 3), P(2, 4))).estado;
    expect(continuou.capturas).toBe(2);
    expect(continuou.vez).toBe('caes');
    expect(continuou.emCadeia).toBe(false);
  });

  it('durante a cadeia a onça não pode só andar', () => {
    const s0 = criarEstado({ onca: P(2, 0), caes: [P(2, 1), P(2, 3), P(0, 4)] });
    const s1 = aplicar(s0, pular(P(2, 0), P(2, 1), P(2, 2))).estado;
    expect(() => aplicar(s1, mover(P(2, 2), P(3, 2)))).toThrow(/inválida/);
  });
});

describe('fim da partida', () => {
  it('a onça vence na 5ª captura, mesmo com cadeia disponível', () => {
    const s0 = criarEstado({ onca: P(2, 0), caes: [P(2, 1), P(2, 3), P(0, 4)], capturas: 4 });
    const { estado, eventos } = aplicar(s0, pular(P(2, 0), P(2, 1), P(2, 2)));
    expect(estado.resultado).toEqual({ tipo: 'onca' });
    expect(estado.emCadeia).toBe(false);
    expect(eventos.at(-1)).toEqual({ tipo: 'fim', resultado: { tipo: 'onca' } });
    expect(jogadasPossiveis(estado)).toEqual([]);
    expect(() => aplicar(estado, { tipo: 'encerrar' })).toThrow(/terminou/);
  });

  it('os cachorros vencem quando a onça fica sem passo nem pulo', () => {
    const s0 = criarEstado({ vez: 'caes', onca: P(6, 0), caes: [P(5, 1), P(4, 2), P(6, 4), P(5, 2)] });
    const { estado } = aplicar(s0, mover(P(5, 2), P(6, 2)));
    expect(estado.resultado).toEqual({ tipo: 'caes' });
  });

  it('empate por repetição: a mesma posição pela 3ª vez', () => {
    const { estado } = novaPartida({ modo: 'classico', semente: 1 });
    const vaiEVolta = [
      mover(P(2, 2), P(3, 2)),
      mover(P(2, 0), P(3, 0)),
      mover(P(3, 2), P(2, 2)),
      mover(P(3, 0), P(2, 0)),
    ];
    const meio = seguir(estado, ...vaiEVolta).estado;
    expect(meio.resultado).toBeNull();
    const fim = seguir(meio, ...vaiEVolta).estado;
    expect(fim.resultado).toEqual({ tipo: 'empate', motivo: 'repeticao' });
  });

  it('empate ao fim da última rodada permitida', () => {
    const config: Config = { ...CONFIG, maxRodadas: 2 };
    const { estado } = novaPartida({ modo: 'classico', semente: 1, config });
    const fim = seguir(
      estado,
      mover(P(2, 2), P(3, 2)),
      mover(P(2, 0), P(3, 0)),
      mover(P(3, 2), P(4, 2)),
      mover(P(3, 0), P(4, 0)),
    ).estado;
    expect(fim.rodada).toBe(2);
    expect(fim.resultado).toEqual({ tipo: 'empate', motivo: 'limiteDeRodadas' });
  });

  it('empate quando os cachorros não têm jogada', () => {
    const s0 = criarEstado({ onca: P(0, 0), caes: [P(6, 0)], queimados: [P(5, 1), P(6, 2)] });
    const { estado } = aplicar(s0, mover(P(0, 0), P(0, 1)));
    expect(estado.resultado).toEqual({ tipo: 'empate', motivo: 'caesSemJogada' });
  });
});

describe('fogo: quando e onde nasce', () => {
  const tresRodadas = [
    mover(P(2, 2), P(3, 2)),
    mover(P(2, 0), P(3, 0)),
    mover(P(3, 2), P(4, 2)),
    mover(P(3, 0), P(4, 0)),
    mover(P(4, 2), P(5, 2)),
    mover(P(4, 0), P(4, 1)),
  ];

  it('segue o calendário 4, 8, 12, 16, 20, 24, 27, 30, 33', () => {
    const rodadas = Array.from({ length: 33 }, (_, i) => i + 1).filter((r) => rodadaDeFoco(r));
    expect(rodadas).toEqual([4, 8, 12, 16, 20, 24, 27, 30, 33]);
  });

  it('não existe no modo clássico', () => {
    const { estado } = novaPartida({ modo: 'classico', semente: 3 });
    const s = seguir(estado, ...tresRodadas).estado;
    expect(s.rodada).toBe(4);
    expect(s.foco).toBeNull();
    expect(proximoFocoEm(s)).toBeNull();
  });

  it('nasce no início da rodada 4, com aviso 2', () => {
    const inicio = novaPartida({ modo: 'territorio', semente: 3 }).estado;
    expect(proximoFocoEm(inicio)).toBe(3);
    const { estado, eventos } = seguir(inicio, ...tresRodadas);
    expect(estado.rodada).toBe(4);
    expect(estado.foco).not.toBeNull();
    expect(estado.foco!.aviso).toBe(2);
    expect(estado.focosNascidos).toBe(1);
    expect(eventos).toContainEqual({ tipo: 'focoNasceu', ponto: estado.foco!.ponto, aviso: 2 });
    expect(proximoFocoEm(estado)).toBe(4);
  });

  it('é o mesmo com a mesma semente', () => {
    const a = seguir(novaPartida({ modo: 'territorio', semente: 42 }).estado, ...tresRodadas).estado;
    const b = seguir(novaPartida({ modo: 'territorio', semente: 42 }).estado, ...tresRodadas).estado;
    expect(a.foco).toEqual(b.foco);
  });

  it('nasce sempre em ponto livre, fora da toca e ao alcance de alguma peça em 2 jogadas', () => {
    const vistos = new Set<Ponto>();
    for (let semente = 1; semente <= 300; semente++) {
      const s = seguir(novaPartida({ modo: 'territorio', semente }).estado, ...tresRodadas).estado;
      const foco = s.foco!.ponto;
      vistos.add(foco);
      expect(TOCA.has(foco)).toBe(false);
      expect(livre(s, foco)).toBe(true);
      const pecas = [s.onca, ...s.caes.filter((c): c is Ponto => c !== null)];
      const aUm = VIZINHOS[foco]!.some((v) => pecas.includes(v));
      const aDois = VIZINHOS[foco]!.some((v) => livre(s, v) && VIZINHOS[v]!.some((w) => pecas.includes(w)));
      expect(aUm || aDois).toBe(true);
    }
    expect(vistos.size).toBeGreaterThan(3);
  });

  it('prefere vizinhos de ponto queimado conforme o peso', () => {
    const config = comFogo({ pesoVizinhoQueimado: 1e9 });
    for (let semente = 1; semente <= 30; semente++) {
      const s0 = criarEstado({
        modo: 'territorio',
        config,
        semente,
        rodada: 3,
        vez: 'caes',
        onca: P(3, 2),
        caes: [P(0, 0), P(0, 1)],
        queimados: [P(4, 4)],
      });
      const s = aplicar(s0, mover(P(0, 0), P(1, 0))).estado;
      expect(VIZINHOS[P(4, 4)]).toContain(s.foco!.ponto);
    }
  });

  it('nunca tem dois focos ao mesmo tempo', () => {
    const config = comFogo({ primeiroFoco: 1, intervalo: 1, aceleraNaRodada: 999, aviso: 3 });
    let s = novaPartida({ modo: 'territorio', semente: 5, config }).estado;
    const primeiro = s.foco!.ponto;
    for (let i = 0; i < 4; i++) {
      const jogada = jogadasPossiveis(s).find((j) => j.tipo === 'mover' && j.para !== primeiro)!;
      s = aplicar(s, jogada).estado;
    }
    expect(s.rodada).toBe(3);
    expect(s.foco).toEqual({ ponto: primeiro, aviso: 1 });
    expect(s.focosNascidos).toBe(1);
  });

  it('não nasce se nenhum ponto cumpre as condições', () => {
    // Onça na toca; o único ponto fora da toca ao alcance, a boca (4,2), está ocupado.
    const s0 = criarEstado({
      modo: 'territorio',
      config: comFogo({ aviso: 1 }),
      rodada: 3,
      vez: 'caes',
      onca: P(6, 2),
      caes: [P(4, 2), P(6, 4)],
      queimados: [P(3, 1), P(3, 2), P(3, 3), P(4, 1), P(4, 3)],
    });
    const s = aplicar(s0, mover(P(6, 4), P(5, 3))).estado;
    expect(s.rodada).toBe(4);
    expect(s.foco).toBeNull();
    expect(s.focosNascidos).toBe(0);
  });
});

describe('fogo: apagar e queimar', () => {
  const base = { modo: 'territorio' as const, rodada: 5 };

  it('um cachorro apaga o foco parando nele', () => {
    const s0 = criarEstado({ ...base, vez: 'caes', onca: P(4, 4), caes: [P(2, 0), P(0, 4)], foco: { ponto: P(3, 0), aviso: 2 } });
    const { estado, eventos } = aplicar(s0, mover(P(2, 0), P(3, 0)));
    expect(estado.foco).toBeNull();
    expect(estado.apagados).toEqual({ onca: 0, caes: 1 });
    expect(estado.queimados).toEqual([]);
    expect(estado.caes[0]).toBe(P(3, 0));
    expect(eventos).toContainEqual({ tipo: 'focoApagado', ponto: P(3, 0), por: 'caes' });
  });

  it('a onça apaga o foco andando até ele', () => {
    const s0 = criarEstado({ ...base, onca: P(3, 2), caes: [P(0, 0), P(0, 4)], foco: { ponto: P(4, 2), aviso: 1 } });
    const { estado, eventos } = aplicar(s0, mover(P(3, 2), P(4, 2)));
    expect(estado.foco).toBeNull();
    expect(estado.apagados).toEqual({ onca: 1, caes: 0 });
    expect(eventos).toContainEqual({ tipo: 'focoApagado', ponto: P(4, 2), por: 'onca' });
  });

  it('a onça apaga o foco ao cair nele num pulo', () => {
    const s0 = criarEstado({ ...base, onca: P(2, 0), caes: [P(2, 1), P(0, 4)], foco: { ponto: P(2, 2), aviso: 1 } });
    const { estado, eventos } = aplicar(s0, pular(P(2, 0), P(2, 1), P(2, 2)));
    expect(estado.foco).toBeNull();
    expect(estado.capturas).toBe(1);
    expect(eventos.map((e) => e.tipo)).toEqual(['capturou', 'focoApagado']);
  });

  it('o aviso cai de 2 para 1 e o ponto queima no fim da rodada seguinte', () => {
    const s0 = criarEstado({ ...base, onca: P(4, 4), caes: [P(0, 0), P(0, 4)], foco: { ponto: P(2, 2), aviso: 2 } });
    const r1 = seguir(s0, mover(P(4, 4), P(4, 3)), mover(P(0, 0), P(1, 0)));
    expect(r1.estado.foco).toEqual({ ponto: P(2, 2), aviso: 1 });
    expect(r1.estado.queimados).toEqual([]);
    expect(r1.eventos).toContainEqual({ tipo: 'focoAviso', ponto: P(2, 2), aviso: 1 });

    const r2 = seguir(r1.estado, mover(P(4, 3), P(4, 4)), mover(P(1, 0), P(0, 0)));
    expect(r2.estado.foco).toBeNull();
    expect(r2.estado.queimados).toEqual([P(2, 2)]);
    expect(r2.eventos).toContainEqual({ tipo: 'queimou', ponto: P(2, 2), total: 1 });
    expect(r2.estado.resultado).toBeNull();
  });

  it('ninguém entra em ponto queimado', () => {
    const s = criarEstado({ ...base, onca: P(2, 1), caes: [P(2, 3), P(1, 2)], queimados: [P(2, 2)] });
    expect(destinos(s)).not.toContain(P(2, 2));
    const caes = criarEstado({ ...base, vez: 'caes', onca: P(2, 1), caes: [P(2, 3), P(1, 2)], queimados: [P(2, 2)] });
    expect(destinos(caes)).not.toContain(P(2, 2));
  });

  it('com 5 pontos queimados o território é destruído', () => {
    const s0 = criarEstado({
      ...base,
      vez: 'caes',
      onca: P(4, 4),
      caes: [P(1, 0), P(1, 4)],
      queimados: [P(0, 0), P(0, 1), P(0, 3), P(0, 4)],
      foco: { ponto: P(2, 2), aviso: 1 },
    });
    const { estado, eventos } = aplicar(s0, mover(P(1, 0), P(2, 0)));
    expect(estado.queimados).toHaveLength(5);
    expect(estado.resultado).toEqual({ tipo: 'territorio' });
    expect(eventos.map((e) => e.tipo)).toEqual(['moveu', 'queimou', 'fim']);
  });
});

describe('fogo: vitória e cerco', () => {
  const quatroQueimados = [P(0, 0), P(0, 1), P(0, 3), P(0, 4)];

  it('o cerco limpo vale mesmo na rodada em que o 5º ponto queimaria', () => {
    const s0 = criarEstado({
      modo: 'territorio',
      rodada: 9,
      vez: 'caes',
      onca: P(6, 0),
      caes: [P(5, 1), P(4, 2), P(6, 4), P(5, 2)],
      queimados: quatroQueimados,
      foco: { ponto: P(0, 2), aviso: 1 },
    });
    const { estado } = aplicar(s0, mover(P(5, 2), P(6, 2)));
    expect(estado.resultado).toEqual({ tipo: 'caes' });
    expect(estado.queimados).toHaveLength(4);
  });

  it('a 5ª captura vale mesmo na rodada em que o 5º ponto queimaria', () => {
    const s0 = criarEstado({
      modo: 'territorio',
      rodada: 9,
      onca: P(2, 0),
      caes: [P(2, 1), P(4, 4)],
      capturas: 4,
      queimados: quatroQueimados,
      foco: { ponto: P(0, 2), aviso: 1 },
    });
    const { estado } = aplicar(s0, pular(P(2, 0), P(2, 1), P(2, 2)));
    expect(estado.resultado).toEqual({ tipo: 'onca' });
  });

  it('cerco com fogo: ponto queimado fechando um pouso tira a vitória dos cachorros', () => {
    const s0 = criarEstado({
      modo: 'territorio',
      rodada: 9,
      vez: 'caes',
      onca: P(6, 0),
      caes: [P(5, 1), P(6, 4), P(5, 2)],
      queimados: [P(4, 2)],
    });
    const { estado } = aplicar(s0, mover(P(5, 2), P(6, 2)));
    expect(estado.resultado).toEqual({ tipo: 'cercoComFogo' });
  });

  it('cerco com fogo: ponto queimado fechando uma saída', () => {
    const s0 = criarEstado({
      modo: 'territorio',
      rodada: 9,
      vez: 'caes',
      onca: P(0, 0),
      caes: [P(0, 1), P(0, 2), P(1, 0), P(2, 0), P(2, 1)],
      queimados: [P(1, 1)],
    });
    expect(jogadasPossiveis({ ...s0, vez: 'onca' })).toEqual([]);
    expect(fogoAjudouCerco(s0)).toBe(true);
    const { estado } = aplicar(s0, mover(P(2, 1), P(3, 1)));
    expect(estado.resultado).toEqual({ tipo: 'cercoComFogo' });
  });

  it('a queimada que tira a última saída da onça também é cerco com fogo', () => {
    const s0 = criarEstado({
      modo: 'territorio',
      rodada: 9,
      vez: 'caes',
      onca: P(0, 0),
      caes: [P(0, 1), P(0, 2), P(1, 0), P(2, 0), P(4, 4)],
      foco: { ponto: P(1, 1), aviso: 1 },
    });
    const { estado, eventos } = aplicar(s0, mover(P(4, 4), P(4, 3)));
    expect(estado.queimados).toEqual([P(1, 1)]);
    expect(estado.resultado).toEqual({ tipo: 'cercoComFogo' });
    expect(eventos.map((e) => e.tipo)).toEqual(['moveu', 'queimou', 'fim']);
  });

  it('fogoAjudouCerco é falso no cerco limpo', () => {
    const cercada = criarEstado({ onca: P(6, 0), caes: [P(5, 1), P(4, 2), P(6, 4), P(6, 2)], queimados: [P(0, 0)] });
    expect(fogoAjudouCerco(cercada)).toBe(false);
  });
});

describe('partidas aleatórias', () => {
  function aleatorio(semente: number): () => number {
    let s = semente >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function conferir(s: Estado): void {
    const vivos = s.caes.filter((c): c is Ponto => c !== null);
    expect(vivos).toHaveLength(14 - s.capturas);
    const pecas = [s.onca, ...vivos];
    expect(new Set(pecas).size).toBe(pecas.length);
    for (const p of pecas) expect(s.queimados).not.toContain(p);
    expect(new Set(s.queimados).size).toBe(s.queimados.length);
    expect(s.queimados.length).toBeLessThanOrEqual(s.config.fogo.limiteQueimados);
    expect(s.rodada).toBeLessThanOrEqual(s.config.maxRodadas);
    if (s.foco) {
      expect(TOCA.has(s.foco.ponto)).toBe(false);
      expect(s.queimados).not.toContain(s.foco.ponto);
      expect(pecas).not.toContain(s.foco.ponto);
      expect(s.foco.aviso).toBeGreaterThanOrEqual(1);
      expect(s.foco.aviso).toBeLessThanOrEqual(s.config.fogo.aviso);
    }
    for (const p of s.queimados) expect(TOCA.has(p)).toBe(false);
  }

  function jogarAteOFim(modo: 'classico' | 'territorio', semente: number): Estado {
    const rnd = aleatorio(semente);
    let s = congelar(novaPartida({ modo, semente }).estado);
    for (let i = 0; i < 2000 && !s.resultado; i++) {
      conferir(s);
      const jogadas = jogadasPossiveis(s);
      expect(jogadas.length).toBeGreaterThan(0);
      s = congelar(aplicar(s, jogadas[Math.floor(rnd() * jogadas.length)]!).estado);
    }
    conferir(s);
    return s;
  }

  it('no modo território sempre terminam, sem quebrar nenhuma invariante', () => {
    const fins = new Set<string>();
    for (let semente = 1; semente <= 300; semente++) {
      const fim = jogarAteOFim('territorio', semente);
      expect(fim.resultado).not.toBeNull();
      fins.add(fim.resultado!.tipo);
    }
    expect(fins.has('territorio')).toBe(true);
  });

  it('no modo clássico sempre terminam e nunca têm fogo', () => {
    for (let semente = 1; semente <= 150; semente++) {
      const fim = jogarAteOFim('classico', semente);
      expect(fim.resultado).not.toBeNull();
      expect(fim.focosNascidos).toBe(0);
      expect(fim.queimados).toEqual([]);
    }
  });
});
