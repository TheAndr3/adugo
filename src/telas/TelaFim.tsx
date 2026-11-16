// Tela de fim de partida (docs/MECANICAS.md, seção 8; docs/ESTETICA.md, seção 10, item 5).
// Mostra o título correspondente ao resultado, os números da partida, as três perguntas
// para a roda de conversa, as cartas que saíram na partida e os botões de ação.

import { IconeTrocar, IconeVoltar } from '../arte';
import { CartaoCarta } from '../componentes/ModalCarta';
import type { Carta } from '../conteudo';
import type { Estado, Resultado } from '../motor';
import './Telas.css';

export function tituloDoResultado(resultado: Resultado | null): string {
  if (!resultado) return 'Fim da partida';
  switch (resultado.tipo) {
    case 'onca':
      return 'A onça venceu';
    case 'caes':
      return 'Os cachorros cercaram a onça';
    case 'territorio':
      return 'Não há vencedor num território destruído';
    case 'cercoComFogo':
      return 'O fogo fechou o cerco. Ninguém venceu';
    case 'empate':
      return 'Ninguém venceu';
  }
}

export function descricaoDoResultado(resultado: Resultado | null): string {
  if (!resultado) return '';
  switch (resultado.tipo) {
    case 'onca':
      return 'A onça capturou 5 cachorros e manteve seu espaço no território.';
    case 'caes':
      return 'Os cachorros fecharam o cerco sozinhos, sem depender de pontos queimados.';
    case 'territorio':
      return 'Com 5 pontos queimados pelo fogo, o território foi destruído e os dois lados perderam.';
    case 'cercoComFogo':
      return 'A onça ficou sem saída, mas um ponto queimado fechava parte do caminho. Com ajuda do fogo, o cerco não dá vitória.';
    case 'empate':
      if (resultado.motivo === 'repeticao') {
        return 'A mesma posição se repetiu 3 vezes sem avanço. Os dois lados perdem.';
      }
      if (resultado.motivo === 'limiteDeRodadas') {
        return 'A partida atingiu o limite de 100 rodadas sem vencedor. Os dois lados perdem.';
      }
      return 'Os cachorros ficaram sem movimento possível. Os dois lados perdem.';
  }
}

export const PERGUNTAS_RODA_DE_CONVERSA: readonly string[] = [
  'Em algum momento vocês precisaram escolher entre avançar na disputa (capturar ou cercar) e apagar um foco de calor? O que pesou mais nessa decisão?',
  'O fogo não é controlado por ninguém, mas afeta a onça e os cachorros de jeitos diferentes. Quem sentiu mais o peso das queimadas na partida e por quê?',
  'O que a regra "não há vencedor num território destruído" e as cartas da partida fazem pensar sobre o que acontece no Pantanal e no Cerrado?',
];

export interface TelaFimProps {
  readonly estado: Estado;
  readonly cartasDaPartida: readonly Carta[];
  readonly aoJogarDeNovo: () => void;
  readonly aoVoltarInicio: () => void;
}

export function TelaFim({
  estado,
  cartasDaPartida,
  aoJogarDeNovo,
  aoVoltarInicio,
}: TelaFimProps) {
  const titulo = tituloDoResultado(estado.resultado);
  const subtitulo = descricaoDoResultado(estado.resultado);
  const temFogo = estado.modo === 'territorio';

  return (
    <main className="tela">
      <header className="painel tela__secao">
        <h1>{titulo}</h1>
        {subtitulo && <p className="fim__subtitulo">{subtitulo}</p>}
      </header>

      <section aria-labelledby="fim-numeros-titulo">
        <h2 id="fim-numeros-titulo">Números da partida</h2>
        <ul className="fim__placar" role="list">
          <li className="fim__item-placar">
            <span className="fim__item-valor">{estado.rodada}</span>
            <span className="fim__item-rotulo">
              {estado.rodada === 1 ? 'Rodada jogada' : 'Rodadas jogadas'}
            </span>
          </li>
          <li className="fim__item-placar">
            <span className="fim__item-valor">
              {estado.capturas} / {estado.config.capturasParaVencer}
            </span>
            <span className="fim__item-rotulo">Cachorros capturados</span>
          </li>
          {temFogo && (
            <>
              <li className="fim__item-placar">
                <span className="fim__item-valor">{estado.apagados.onca}</span>
                <span className="fim__item-rotulo">Focos apagados pela onça</span>
              </li>
              <li className="fim__item-placar">
                <span className="fim__item-valor">{estado.apagados.caes}</span>
                <span className="fim__item-rotulo">Focos apagados pelos cachorros</span>
              </li>
              <li className="fim__item-placar">
                <span className="fim__item-valor">
                  {estado.queimados.length} / {estado.config.fogo.limiteQueimados}
                </span>
                <span className="fim__item-rotulo">Pontos queimados</span>
              </li>
            </>
          )}
        </ul>
      </section>

      <section className="painel tela__secao" aria-labelledby="fim-roda-titulo">
        <h2 id="fim-roda-titulo">Para a roda de conversa</h2>
        <ol className="fim__perguntas">
          {PERGUNTAS_RODA_DE_CONVERSA.map((pergunta) => (
            <li key={pergunta}>{pergunta}</li>
          ))}
        </ol>
      </section>

      {temFogo && (
        <section aria-labelledby="fim-cartas-titulo">
          <h2 id="fim-cartas-titulo">
            Cartas que apareceram na partida ({cartasDaPartida.length})
          </h2>
          {cartasDaPartida.length === 0 ? (
            <p className="painel tela__secao">
              Nenhuma carta foi aberta nesta partida.
            </p>
          ) : (
            <ul className="fim__cartas-grade" role="list">
              {cartasDaPartida.map((carta) => (
                <li key={carta.id}>
                  <CartaoCarta carta={carta} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="fim__acoes">
        <button type="button" className="botao" onClick={aoJogarDeNovo}>
          <IconeTrocar aria-hidden="true" />
          Jogar de novo trocando de lado
        </button>
        <button type="button" className="botao botao--secundario" onClick={aoVoltarInicio}>
          <IconeVoltar aria-hidden="true" />
          Início
        </button>
      </footer>
    </main>
  );
}
