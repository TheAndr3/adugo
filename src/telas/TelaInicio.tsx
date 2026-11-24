// Tela inicial do jogo (docs/ESTETICA.md, seção 10, item 1).
// Exibe o logotipo, subtítulo "Território da Onça", ilustração da capa os 4 botões e o rodapé com os criadores e o link do repositório.

import { IconeChama, IconeRegras, IconeSobre, Logotipo } from '../arte';
import capaUrl from '../arte/capa/capa.svg';
import type { Modo } from '../motor';
import './Telas.css';

export interface TelaInicioProps {
  readonly aoIniciarPartida: (modo: Modo) => void;
  readonly aoAbrirComoJogar: () => void;
  readonly aoAbrirSobre: () => void;
}

export function TelaInicio({
  aoIniciarPartida,
  aoAbrirComoJogar,
  aoAbrirSobre,
}: TelaInicioProps) {
  return (
    <main className="tela-inicio">
      <header className="tela-inicio__cabecalho">
        <h1>
          <span className="visually-hidden">Adugo: </span>
          <Logotipo className="tela-inicio__logo" aria-hidden="true" />
          <span className="tela-inicio__subtitulo">Território da Onça</span>
        </h1>
      </header>

      <div className="tela-inicio__palco">
        <img
          className="tela-inicio__capa"
          src={capaUrl}
          alt="Ilustração vista de cima: pedra pintada da onça e cinco seixos de cachorros sobre o tabuleiro riscado no chão, com um foco de calor e fumaça à direita"
        />
      </div>

      <nav className="tela-inicio__acoes" aria-label="Menu principal">
        <button
          type="button"
          className="botao"
          onClick={() => aoIniciarPartida('territorio')}
        >
          <IconeChama aria-hidden="true" />
          Jogar com o fogo
        </button>

        <button
          type="button"
          className="botao botao--secundario"
          onClick={() => aoIniciarPartida('classico')}
        >
          Adugo clássico
        </button>

        <button
          type="button"
          className="botao botao--secundario"
          onClick={aoAbrirComoJogar}
        >
          <IconeRegras aria-hidden="true" />
          Como se joga
        </button>

        <button
          type="button"
          className="botao botao--secundario"
          onClick={aoAbrirSobre}
        >
          <IconeSobre aria-hidden="true" />
          Sobre o jogo e o povo Bororo
        </button>
      </nav>

      <footer className="tela-inicio__rodape">
        <p>Feito por André Vinícius, José Alberto e Luan Rodrigues</p>
        <a
          href="https://github.com/TheAndr3/adugo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Código do projeto no GitHub
          <span className="visually-hidden"> (abre em nova aba)</span>
        </a>
      </footer>
    </main>
  );
}
