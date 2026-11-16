import { describe, expect, it } from 'vitest';
import { ponto as P, type Evento } from '../motor';
import {
  CARTAS,
  criarBaralho,
  extrairCartaDaJogada,
  iniciarPartidaNoBaralho,
  type TipoCarta,
} from './index';

describe('catálogo de 18 cartas (cartas.json)', () => {
  it('tem exatamente 18 cartas, 6 de cada tipo, com IDs únicos', () => {
    expect(CARTAS).toHaveLength(18);
    const ids = new Set(CARTAS.map((c) => c.id));
    expect(ids.size).toBe(18);

    const tipos: TipoCarta[] = ['queimada', 'cuidado', 'onca'];
    for (const tipo of tipos) {
      const doTipo = CARTAS.filter((c) => c.tipo === tipo);
      expect(doTipo).toHaveLength(6);
    }
  });

  it('respeita o limite de 220 caracteres e possui fonte verificada em todas as cartas', () => {
    for (const carta of CARTAS) {
      expect(carta.texto.length).toBeGreaterThan(20);
      expect(carta.texto.length).toBeLessThanOrEqual(220);
      expect(carta.fonte.titulo.trim().length).toBeGreaterThan(0);
      expect(carta.fonte.autor.trim().length).toBeGreaterThan(0);
      expect(carta.fonte.ano).toBeGreaterThanOrEqual(1900);
      expect(carta.fonte.url).toMatch(/^https:\/\//);
    }
  });
});

describe('baralho da sessão', () => {
  it('embaralha de forma determinística com a mesma semente', () => {
    const a = criarBaralho(42);
    const b = criarBaralho(42);
    const c = criarBaralho(99);

    expect(a.pilhas).toEqual(b.pilhas);
    expect(a.pilhas.queimada.map((x) => x.id)).not.toEqual(c.pilhas.queimada.map((x) => x.id));
  });

  it('continua o baralho de uma partida para a outra sem repetir cartas já saídas', () => {
    let b = criarBaralho(7);
    const vistas = new Set<string>();

    // Partida 1: saem 3 cartas de queimada
    for (let total = 1; total <= 3; total++) {
      const passo = extrairCartaDaJogada(b, [{ tipo: 'queimou', ponto: P(0, total), total }]);
      expect(passo.carta).not.toBeNull();
      vistas.add(passo.carta!.id);
      b = passo.baralho;
    }
    expect(b.cartasDaPartida).toHaveLength(3);
    expect(b.pilhas.queimada).toHaveLength(3);

    // Nova partida trocando de lado: limpa histórico da partida, mas mantém as 3 restantes
    b = iniciarPartidaNoBaralho(b);
    expect(b.cartasDaPartida).toEqual([]);
    expect(b.pilhas.queimada).toHaveLength(3);

    for (let total = 1; total <= 3; total++) {
      const passo = extrairCartaDaJogada(b, [{ tipo: 'queimou', ponto: P(1, total), total }]);
      expect(passo.carta).not.toBeNull();
      expect(vistas.has(passo.carta!.id)).toBe(false);
      vistas.add(passo.carta!.id);
      b = passo.baralho;
    }
    expect(vistas.size).toBe(6);
    expect(b.pilhas.queimada).toHaveLength(0);

    // Baralho vazio: o gatilho deixa de mostrar carta
    const vazio = extrairCartaDaJogada(b, [{ tipo: 'queimou', ponto: P(2, 0), total: 4 }]);
    expect(vazio.carta).toBeNull();
  });
});

describe('gatilhos e prioridades (extrairCartaDaJogada)', () => {
  it('não dispara cartas no modo clássico', () => {
    const b = criarBaralho(1);
    const passo = extrairCartaDaJogada(
      b,
      [{ tipo: 'capturou', cao: 0, de: P(2, 2), sobre: P(2, 1), para: P(2, 0) }],
      { modo: 'classico' },
    );
    expect(passo.carta).toBeNull();
    expect(passo.baralho.cartasDaPartida).toHaveLength(0);
  });

  it('dispara Queimada nas queimadas 1 a 4, mas não na 5ª (que vai para a tela final)', () => {
    let b = criarBaralho(1);
    for (let total = 1; total <= 4; total++) {
      const p = extrairCartaDaJogada(b, [{ tipo: 'queimou', ponto: P(0, total - 1), total }]);
      expect(p.carta?.tipo).toBe('queimada');
      b = p.baralho;
    }

    const quinta: Evento[] = [
      { tipo: 'queimou', ponto: P(0, 4), total: 5 },
      { tipo: 'fim', resultado: { tipo: 'territorio' } },
    ];
    const fim = extrairCartaDaJogada(b, quinta);
    expect(fim.carta).toBeNull();
  });

  it('dispara Cuidado apenas na 1ª, 3ª, 5ª… vez que um foco é apagado', () => {
    let b = criarBaralho(1);
    const resultados: (TipoCarta | null)[] = [];

    for (let i = 1; i <= 6; i++) {
      const p = extrairCartaDaJogada(b, [{ tipo: 'focoApagado', ponto: P(3, 2), por: 'caes' }]);
      resultados.push(p.carta?.tipo ?? null);
      b = p.baralho;
    }

    expect(resultados).toEqual(['cuidado', null, 'cuidado', null, 'cuidado', null]);
  });

  it('dispara Onça e Bororo no máximo uma vez por jogada da onça, mesmo em captura em cadeia', () => {
    let b = criarBaralho(1);

    // 1º pulo da cadeia (ainda emCadeia: true)
    const pulo1 = extrairCartaDaJogada(
      b,
      [{ tipo: 'capturou', cao: 0, de: P(2, 0), sobre: P(2, 1), para: P(2, 2) }],
      { emCadeia: true },
    );
    expect(pulo1.carta?.tipo).toBe('onca');
    b = pulo1.baralho;

    // 2º pulo na mesma jogada (encerra a cadeia: emCadeia: false) -> não repete carta na mesma jogada
    const pulo2 = extrairCartaDaJogada(
      b,
      [{ tipo: 'capturou', cao: 1, de: P(2, 2), sobre: P(2, 3), para: P(2, 4) }],
      { emCadeia: false },
    );
    expect(pulo2.carta).toBeNull();
    b = pulo2.baralho;

    // Na rodada seguinte, a onça captura novamente -> volta a disparar normalmente
    const rodadaSeguinte = extrairCartaDaJogada(
      b,
      [{ tipo: 'capturou', cao: 2, de: P(2, 4), sobre: P(1, 4), para: P(0, 4) }],
      { emCadeia: false },
    );
    expect(rodadaSeguinte.carta?.tipo).toBe('onca');
  });

  it('limpa oncaDisparouNaJogada quando a onça encerra a cadeia sem eventos', () => {
    const b0 = criarBaralho(1);
    const pulo1 = extrairCartaDaJogada(
      b0,
      [{ tipo: 'capturou', cao: 0, de: P(2, 0), sobre: P(2, 1), para: P(2, 2) }],
      { emCadeia: true },
    );
    expect(pulo1.baralho.oncaDisparouNaJogada).toBe(true);

    const encerrou = extrairCartaDaJogada(pulo1.baralho, [], { emCadeia: false });
    expect(encerrou.carta).toBeNull();
    expect(encerrou.baralho.oncaDisparouNaJogada).toBe(false);
  });

  it('respeita a prioridade Queimada > Onça e Bororo > Cuidado quando gatilhos coincidem', () => {
    const b0 = criarBaralho(1);

    // Onça captura caindo sobre um foco (1º foco apagado da partida): Onça e Bororo > Cuidado
    const capMaisCuidado = extrairCartaDaJogada(
      b0,
      [
        { tipo: 'capturou', cao: 0, de: P(2, 0), sobre: P(2, 1), para: P(2, 2) },
        { tipo: 'focoApagado', ponto: P(2, 2), por: 'onca' },
      ],
      { emCadeia: false },
    );
    expect(capMaisCuidado.carta?.tipo).toBe('onca');
    expect(capMaisCuidado.baralho.apagadosNaPartida).toBe(1);

    // Queimada + Cuidado/Onça no mesmo lote de eventos: Queimada vence
    const queimadaMaisOnca = extrairCartaDaJogada(b0, [
      { tipo: 'capturou', cao: 0, de: P(2, 0), sobre: P(2, 1), para: P(2, 2) },
      { tipo: 'queimou', ponto: P(4, 4), total: 1 },
    ]);
    expect(queimadaMaisOnca.carta?.tipo).toBe('queimada');
  });
});
