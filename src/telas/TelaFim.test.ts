import { describe, expect, it } from 'vitest';
import { PERGUNTAS_RODA_DE_CONVERSA, descricaoDoResultado, tituloDoResultado } from './TelaFim';

describe('TelaFim — títulos e textos da seção 8 de docs/MECANICAS.md', () => {
  it('retorna exatamente os 5 títulos especificados na tabela da seção 8', () => {
    expect(tituloDoResultado({ tipo: 'onca' })).toBe('A onça venceu');
    expect(tituloDoResultado({ tipo: 'caes' })).toBe('Os cachorros cercaram a onça');
    expect(tituloDoResultado({ tipo: 'territorio' })).toBe(
      'Não há vencedor num território destruído',
    );
    expect(tituloDoResultado({ tipo: 'cercoComFogo' })).toBe(
      'O fogo fechou o cerco. Ninguém venceu',
    );
    expect(tituloDoResultado({ tipo: 'empate', motivo: 'repeticao' })).toBe('Ninguém venceu');
    expect(tituloDoResultado({ tipo: 'empate', motivo: 'limiteDeRodadas' })).toBe('Ninguém venceu');
    expect(tituloDoResultado({ tipo: 'empate', motivo: 'caesSemJogada' })).toBe('Ninguém venceu');
  });

  it('fornece descrição explicativa para cada motivo de fim e 3 perguntas para a roda de conversa', () => {
    expect(descricaoDoResultado({ tipo: 'cercoComFogo' })).toMatch(/ponto queimado/);
    expect(descricaoDoResultado({ tipo: 'empate', motivo: 'repeticao' })).toMatch(/3 vezes/);
    expect(PERGUNTAS_RODA_DE_CONVERSA).toHaveLength(3);
  });
});
