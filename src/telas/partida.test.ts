import { describe, expect, it } from 'vitest';
import { aplicar, criarEstado, novaPartida, ponto as P, proximoFocoEm, type Jogada } from '../motor';
import {
  anunciar,
  destinosDe,
  encenar,
  interpretarToque,
  precisaConfirmarSaida,
  selecaoInicial,
  textoDaVez,
  textoDoFogo,
} from './partida';

const contador = () => {
  let n = 0;
  return () => ++n;
};

describe('seleção e destinos', () => {
  const inicio = novaPartida({ modo: 'classico', semente: 1 }).estado;

  it('a onça já começa selecionada, com os três passos possíveis', () => {
    expect(selecaoInicial(inicio)).toBe(P(2, 2));
    const destinos = destinosDe(inicio, P(2, 2));
    expect(destinos.map((d) => d.ponto).sort()).toEqual([P(3, 1), P(3, 2), P(3, 3)]);
    expect(destinos.every((d) => !d.captura)).toBe(true);
  });

  it('na vez dos cachorros ninguém vem selecionado', () => {
    const s = aplicar(inicio, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;
    expect(selecaoInicial(s)).toBeNull();
    expect(destinosDe(s, null)).toEqual([]);
    expect(destinosDe(s, P(2, 1)).map((d) => d.ponto).sort()).toEqual([P(2, 2), P(3, 1)]);
  });

  it('marca o pouso de um pulo como captura', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0)] });
    expect(destinosDe(s, P(2, 2))).toContainEqual({ ponto: P(2, 4), captura: true });
  });

  it('não seleciona nada com a partida encerrada', () => {
    const fim = { ...inicio, resultado: { tipo: 'onca' } as const };
    expect(selecaoInicial(fim)).toBeNull();
    expect(interpretarToque(fim, null, P(3, 2))).toBeNull();
  });
});

describe('toque', () => {
  const inicio = novaPartida({ modo: 'classico', semente: 1 }).estado;
  const vezDosCaes = aplicar(inicio, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;

  it('em um destino da peça selecionada, joga', () => {
    expect(interpretarToque(inicio, P(2, 2), P(3, 1))).toEqual({
      tipo: 'jogar',
      jogada: { tipo: 'mover', de: P(2, 2), para: P(3, 1) },
    });
  });

  it('em um pouso de captura, pula', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(2, 3), P(0, 0)] });
    const pulo: Jogada = { tipo: 'pular', de: P(2, 2), sobre: P(2, 3), para: P(2, 4) };
    expect(interpretarToque(s, P(2, 2), P(2, 4))).toEqual({ tipo: 'jogar', jogada: pulo });
  });

  it('na vez da onça, fora dos destinos não muda nada', () => {
    expect(interpretarToque(inicio, P(2, 2), P(4, 4))).toBeNull();
    expect(interpretarToque(inicio, P(2, 2), P(1, 2))).toBeNull();
    expect(interpretarToque(inicio, null, P(2, 2))).toEqual({ tipo: 'selecionar', ponto: P(2, 2) });
  });

  it('na vez dos cachorros, seleciona e troca de cachorro', () => {
    expect(interpretarToque(vezDosCaes, null, P(2, 1))).toEqual({ tipo: 'selecionar', ponto: P(2, 1) });
    expect(interpretarToque(vezDosCaes, P(2, 1), P(2, 3))).toEqual({ tipo: 'selecionar', ponto: P(2, 3) });
    expect(interpretarToque(vezDosCaes, P(2, 1), P(2, 1))).toBeNull();
  });

  it('não seleciona cachorro sem movimento, nem a onça na vez dos cachorros', () => {
    expect(interpretarToque(vezDosCaes, null, P(0, 0))).toBeNull();
    expect(interpretarToque(vezDosCaes, null, P(3, 2))).toBeNull();
  });

  it('tocar fora desfaz a seleção do cachorro', () => {
    expect(interpretarToque(vezDosCaes, P(2, 1), P(4, 4))).toEqual({ tipo: 'selecionar', ponto: null });
  });

  it('durante a captura em cadeia só aceita o próximo pulo', () => {
    const s0 = criarEstado({ onca: P(2, 0), caes: [P(2, 1), P(2, 3), P(0, 4)] });
    const s1 = aplicar(s0, { tipo: 'pular', de: P(2, 0), sobre: P(2, 1), para: P(2, 2) }).estado;
    expect(selecaoInicial(s1)).toBe(P(2, 2));
    expect(destinosDe(s1, P(2, 2))).toEqual([{ ponto: P(2, 4), captura: true }]);
    expect(interpretarToque(s1, P(2, 2), P(3, 2))).toBeNull();
    expect(textoDaVez(s1)).toBe('A onça pode pular de novo');
  });
});

describe('encenação dos eventos', () => {
  it('um passo vira salto leve e trilha', () => {
    const inicio = novaPartida({ modo: 'classico', semente: 1 }).estado;
    const { eventos } = aplicar(inicio, { tipo: 'mover', de: P(2, 2), para: P(3, 2) });
    const cena = encenar(eventos, contador());
    expect(cena.salto).toMatchObject({ peca: 'onca', pulo: false });
    expect(cena.ultimaJogada).toEqual({ de: P(2, 2), para: P(3, 2) });
    expect(cena.efeitos).toEqual([]);
    expect(cena.espera).toBeGreaterThanOrEqual(220);
  });

  it('o movimento de um cachorro aponta o cachorro certo', () => {
    const inicio = novaPartida({ modo: 'classico', semente: 1 }).estado;
    const s = aplicar(inicio, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;
    const cena = encenar(aplicar(s, { tipo: 'mover', de: P(2, 0), para: P(3, 0) }).eventos, contador());
    expect(cena.salto).toMatchObject({ peca: 10, pulo: false });
  });

  it('uma captura vira pulo e efeito sobre o cachorro capturado', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(0, 0), P(2, 3)] });
    const cena = encenar(aplicar(s, { tipo: 'pular', de: P(2, 2), sobre: P(2, 3), para: P(2, 4) }).eventos, contador());
    expect(cena.salto).toMatchObject({ peca: 'onca', pulo: true });
    expect(cena.efeitos).toMatchObject([{ tipo: 'captura', ponto: P(2, 3), cao: 1 }]);
    expect(cena.espera).toBeGreaterThanOrEqual(320);
  });

  it('foco apagado e ponto queimado viram efeitos com ids diferentes', () => {
    const apagar = criarEstado({
      modo: 'territorio',
      rodada: 5,
      vez: 'caes',
      onca: P(4, 4),
      caes: [P(2, 0), P(0, 4)],
      foco: { ponto: P(3, 0), aviso: 2 },
    });
    const cenaApagar = encenar(aplicar(apagar, { tipo: 'mover', de: P(2, 0), para: P(3, 0) }).eventos, contador());
    expect(cenaApagar.efeitos).toMatchObject([{ tipo: 'apagado', ponto: P(3, 0) }]);

    const queimar = criarEstado({
      modo: 'territorio',
      rodada: 5,
      vez: 'caes',
      onca: P(4, 4),
      caes: [P(0, 0), P(0, 4)],
      foco: { ponto: P(2, 2), aviso: 1 },
    });
    const cenaQueimar = encenar(aplicar(queimar, { tipo: 'mover', de: P(0, 0), para: P(1, 0) }).eventos, contador());
    expect(cenaQueimar.efeitos).toMatchObject([{ tipo: 'queimou', ponto: P(2, 2) }]);
    expect(cenaQueimar.espera).toBeGreaterThanOrEqual(700);
    expect(new Set([cenaQueimar.salto!.id, ...cenaQueimar.efeitos.map((e) => e.id)]).size).toBe(2);
  });

  it('encerrar a cadeia não encena nada', () => {
    expect(encenar([], contador())).toEqual({ efeitos: [], salto: null, ultimaJogada: null, espera: 0 });
  });
});

describe('textos', () => {
  it('anuncia a captura e de quem é a vez', () => {
    const s = criarEstado({ onca: P(2, 2), caes: [P(0, 0), P(2, 3)] });
    const { estado, eventos } = aplicar(s, { tipo: 'pular', de: P(2, 2), sobre: P(2, 3), para: P(2, 4) });
    expect(anunciar(eventos, estado)).toBe('A onça capturou um cachorro: 1 de 5. Vez dos cachorros.');
  });

  it('anuncia o foco novo com o lugar e o prazo', () => {
    const s = criarEstado({ modo: 'territorio', rodada: 3, vez: 'caes', onca: P(3, 2), caes: [P(0, 0), P(0, 1)], semente: 9 });
    const { estado, eventos } = aplicar(s, { tipo: 'mover', de: P(0, 0), para: P(1, 0) });
    expect(anunciar(eventos, estado)).toMatch(/^Novo foco de calor na fileira \d, coluna \d\. Queima em 2 rodadas\. Vez da onça\.$/);
  });

  it('anuncia a queimada e não anuncia vez quando a partida acaba', () => {
    const s = criarEstado({
      modo: 'territorio',
      rodada: 5,
      vez: 'caes',
      onca: P(4, 4),
      caes: [P(1, 0), P(1, 4)],
      queimados: [P(0, 0), P(0, 1), P(0, 3), P(0, 4)],
      foco: { ponto: P(2, 2), aviso: 1 },
    });
    const { estado, eventos } = aplicar(s, { tipo: 'mover', de: P(1, 0), para: P(2, 0) });
    expect(anunciar(eventos, estado)).toBe('O ponto da fileira 3, coluna 3 queimou: 5 de 5.');
    expect(textoDaVez(estado)).toBe('Fim da partida');
  });

  it('informa o fogo só no modo território', () => {
    const classico = novaPartida({ modo: 'classico', semente: 1 }).estado;
    expect(textoDoFogo(classico, proximoFocoEm(classico))).toBeNull();

    const territorio = novaPartida({ modo: 'territorio', semente: 1 }).estado;
    expect(textoDoFogo(territorio, proximoFocoEm(territorio))).toBe('Próximo foco em 3 rodadas');

    const comFoco = criarEstado({ modo: 'territorio', foco: { ponto: P(3, 2), aviso: 1 } });
    expect(textoDoFogo(comFoco, proximoFocoEm(comFoco))).toBe('Foco queima em 1 rodada');
  });
});

describe('confirmação de saída', () => {
  const inicio = novaPartida({ modo: 'territorio', semente: 1 }).estado;

  it('sai direto antes de qualquer jogada', () => {
    expect(precisaConfirmarSaida(inicio)).toBe(false);
  });

  it('pergunta assim que a onça jogou, mesmo ainda na rodada 1', () => {
    const s = aplicar(inicio, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;
    expect(s.rodada).toBe(1);
    expect(precisaConfirmarSaida(s)).toBe(true);
  });

  it('pergunta durante a captura em cadeia da primeira jogada', () => {
    const s0 = criarEstado({ onca: P(2, 0), caes: [P(2, 1), P(2, 3), P(0, 4)] });
    const s1 = aplicar(s0, { tipo: 'pular', de: P(2, 0), sobre: P(2, 1), para: P(2, 2) }).estado;
    expect(s1.vez).toBe('onca');
    expect(precisaConfirmarSaida(s1)).toBe(true);
  });

  it('sai direto quando a partida já acabou', () => {
    expect(precisaConfirmarSaida({ ...inicio, rodada: 30, resultado: { tipo: 'onca' } })).toBe(false);
  });
});
