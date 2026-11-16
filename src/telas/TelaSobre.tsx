// Tela "Sobre o jogo e o povo Bororo" (docs/ESTETICA.md, seções 1 e 10, item 6).
// Apresenta a origem do Adugo entre o povo Boe (Bororo), o que é liberdade artística/pedagógica
// da nossa adaptação, as fontes consultadas e os créditos do projeto.

import { IconeVoltar, Logotipo } from '../arte';
import './Telas.css';

export interface TelaSobreProps {
  readonly aoVoltar: () => void;
}

export function TelaSobre({ aoVoltar }: TelaSobreProps) {
  return (
    <main className="tela">
      <header className="tela__topo">
        <div>
          <Logotipo style={{ width: 'min(100%, 260px)', height: 'auto', display: 'block' }} role="img" aria-label="Adugo" />
          <h1>Sobre o jogo e o povo Bororo</h1>
        </div>
        <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
          <IconeVoltar aria-hidden="true" />
          Voltar ao início
        </button>
      </header>

      <section className="painel tela__secao" aria-labelledby="sobre-bororo-titulo">
        <h2 id="sobre-bororo-titulo">O Adugo e o povo Boe (Bororo)</h2>
        <p>
          Na língua do povo indígena <strong>Bororo</strong> — que se autodenomina <strong>Boe</strong> —, a palavra{' '}
          <em>adugo</em> significa <strong>onça-pintada</strong>. Originário de territórios tradicionais no atual
          estado de Mato Grosso, entre o Cerrado e o Pantanal, o Adugo (conhecido em português como Jogo da Onça) é um
          jogo de estratégia assimétrico transmitido entre gerações.
        </p>
        <p>
          Tradicionalmente, o tabuleiro de 31 pontos (uma grade de 25 pontos ligada a um triângulo de 6 pontos, a toca)
          é riscado diretamente na terra batida ou na areia do pátio da aldeia com um graveto, e as peças são seixos de
          rio ou sementes: <strong>uma única onça</strong> contra <strong>14 cachorros</strong>. Enquanto a onça vence
          pela mobilidade e pelos pulos de captura, os cachorros não capturam: precisam avançar juntos e cooperar para
          cercar a onça sem deixar brechas.
        </p>
      </section>

      <section className="painel tela__secao" aria-labelledby="sobre-liberdade-titulo">
        <h2 id="sobre-liberdade-titulo">O que é tradição e o que é liberdade nossa</h2>
        <p>
          A equipe que desenvolveu este projeto não é indígena Bororo. Por respeito à cultura e ao patrimônio imaterial
          do povo Boe, seguimos limites estéticos claros:
        </p>
        <ul className="sobre__lista">
          <li>
            <strong>Não reproduzimos grafismos Bororo:</strong> nenhum asset imita padrões de pintura corporal,
            plumária, cestaria ou cerâmica tradicional, que possuem significados rituais e pertencem aos clãs e metades
            da sociedade Boe.
          </li>
          <li>
            <strong>As rosetas na pedra da onça são liberdade nossa:</strong> no jogo tradicional, a onça é apenas uma
            pedra maior ou uma semente diferente das demais. Aqui pintamos rosetas escuras na pedra da onça para
            garantir leitura imediata no celular e no projetor, inclusive para quem não distingue cores com facilidade.
          </li>
          <li>
            <strong>O fogo e as cartas são uma camada educativa:</strong> o modo <em>Adugo clássico</em> mantém as
            regras tradicionais do tabuleiro. Já o modo <em>Território da Onça</em> foi criado para a sala de aula: o
            fogo entra como um terceiro elemento que ameaça o chão comum, provocando a reflexão de que não há vencedor
            quando o território é destruído.
          </li>
        </ul>
      </section>

      <div className="sobre__grade">
        <section className="painel tela__secao" aria-labelledby="sobre-fontes-titulo">
          <h2 id="sobre-fontes-titulo">Fontes e referências</h2>
          <ul className="sobre__lista">
            <li>
              <a
                className="sobre__link"
                href="https://pib.socioambiental.org/pt/Povo:Boe_(Bororo)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Enciclopédia Povos Indígenas no Brasil — Povo Boe (Bororo)
              </a>{' '}
              (Instituto Socioambiental — ISA)
            </li>
            <li>
              <a
                className="sobre__link"
                href="https://plataforma.brasil.mapbiomas.org/fogo"
                target="_blank"
                rel="noopener noreferrer"
              >
                MapBiomas Fogo — Mapeamento de Cicatrizes de Fogo no Brasil
              </a>
            </li>
            <li>
              <a
                className="sobre__link"
                href="https://terrabrasilis.dpi.inpe.br/queimadas/portal/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Programa Queimadas — Monitoramento por Satélites (INPE)
              </a>
            </li>
            <li>
              <a
                className="sobre__link"
                href="https://lasa.ufrj.br/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sistema ALARMES — Laboratório de Aplicações de Satélites Ambientais (LASA/UFRJ)
              </a>
            </li>
            <li>
              <a
                className="sobre__link"
                href="https://www.gov.br/ibama/pt-br/assuntos/fiscalizacao-e-protecao-ambiental/manejo-integrado-do-fogo"
                target="_blank"
                rel="noopener noreferrer"
              >
                Prevfogo e Manejo Integrado do Fogo (IBAMA)
              </a>
            </li>
            <li>
              <a
                className="sobre__link"
                href="https://www.gov.br/icmbio/pt-br/assuntos/centros-de-pesquisa/mamiferos-carnivoros"
                target="_blank"
                rel="noopener noreferrer"
              >
                Centro Nacional de Pesquisa e Conservação de Mamíferos Carnívoros (CENAP/ICMBio)
              </a>
            </li>
          </ul>
        </section>

        <section className="painel tela__secao" aria-labelledby="sobre-projeto-titulo">
          <h2 id="sobre-projeto-titulo">Projeto e disciplina</h2>
          <p>
            <strong>Adugo: Território da Onça</strong> é um jogo digital educativo para 2 pessoas pensado para uso em
            sala de aula (no celular ou no projetor), seguido de uma roda de conversa mediada pelas cartas e pelas
            escolhas feitas durante a partida.
          </p>
          <p>
            Desenvolvido como projeto acadêmico, combinando etnomatemática, educação ambiental e valorização da história
            e cultura dos povos indígenas (Lei nº 11.645/2008).
          </p>
        </section>
      </div>

      <footer>
        <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
          <IconeVoltar aria-hidden="true" />
          Voltar ao início
        </button>
      </footer>
    </main>
  );
}
