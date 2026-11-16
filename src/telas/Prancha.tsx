// Prancha: todos os assets sobre o chão, no tamanho de celular e no dobro
// (docs/ESTETICA.md, seção 13). Abrir em /#prancha.

import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import {
  Broto,
  CachorroA,
  CachorroB,
  CachorroC,
  Capim,
  Foco,
  Fumaca,
  IconeBroto,
  IconeChama,
  IconeFechar,
  IconePataCachorro,
  IconePataOnca,
  IconeRegras,
  IconeReiniciar,
  IconeSobre,
  IconeTrocar,
  IconeVoltar,
  Logotipo,
  Onca,
  Queimado,
} from '../arte';
import capaUrl from '../arte/capa/capa.svg';
import { CartaoCarta, ModalCarta } from '../componentes/ModalCarta';
import { Tabuleiro } from '../componentes/Tabuleiro';
import { CARTAS, type Carta } from '../conteudo';
import { ponto as P } from '../motor';
import './Prancha.css';

type Svg = ComponentType<SVGProps<SVGSVGElement>>;

/** Fator do tabuleiro no menor celular: 318 px de largura para 520 unidades. */
const CELULAR = 318 / 520;

const PALETA: readonly (readonly [grupo: string, tokens: readonly string[]])[] = [
  ['Chão', ['terra-100', 'terra-300', 'terra-500', 'terra-700', 'terra-900']],
  ['Pedra', ['pedra-300', 'pedra-500', 'pedra-800']],
  ['Onça', ['onca-300', 'onca-400', 'onca-600', 'onca-pinta']],
  ['Fogo', ['brasa-300', 'fogo-500', 'fogo-700']],
  ['Queimado', ['carvao-900', 'carvao-700', 'cinza-400']],
  ['Vida', ['mata-600', 'mata-400']],
  ['Papel', ['papel-100', 'papel-300']],
];

const ICONES: readonly (readonly [nome: string, Icone: Svg])[] = [
  ['pata-onca', IconePataOnca],
  ['pata-cachorro', IconePataCachorro],
  ['chama', IconeChama],
  ['broto', IconeBroto],
  ['regras', IconeRegras],
  ['reiniciar', IconeReiniciar],
  ['trocar', IconeTrocar],
  ['voltar', IconeVoltar],
  ['fechar', IconeFechar],
  ['sobre', IconeSobre],
];

/** Um asset no tamanho de celular e no dobro. `unidades` é o tamanho dele no tabuleiro. */
function Amostra({ nome, Arte, unidades, className }: { nome: string; Arte: Svg; unidades: number; className?: string }) {
  const px = Math.round(unidades * CELULAR);
  return (
    <figure className="amostra">
      <div className="amostra__tamanhos">
        <Arte width={px} height={px} className={className} />
        <Arte width={px * 2} height={px * 2} className={className} />
      </div>
      <figcaption>
        {nome} · {px} e {px * 2} px
      </figcaption>
    </figure>
  );
}

const JOGO = {
  onca: P(3, 2),
  caes: [P(0, 1), P(0, 2), P(0, 3), null, P(1, 0), P(1, 1), P(1, 2), P(1, 3), P(1, 4), P(2, 0), P(2, 1), P(2, 2), P(3, 3), null],
  queimados: [P(4, 4), P(0, 0)],
};

export function Prancha() {
  const [parado, setParado] = useState(false);
  const [tocado, setTocado] = useState<string | null>(null);
  const [cartaAberta, setCartaAberta] = useState<Carta | null>(null);

  const exemploQueimada = CARTAS.find((c) => c.tipo === 'queimada')!;
  const exemploCuidado = CARTAS.find((c) => c.tipo === 'cuidado')!;
  const exemploOnca = CARTAS.find((c) => c.tipo === 'onca')!;

  useEffect(() => {
    if (parado) document.documentElement.dataset.movimento = 'parado';
    else delete document.documentElement.dataset.movimento;
    return () => {
      delete document.documentElement.dataset.movimento;
    };
  }, [parado]);

  return (
    <main className="prancha">
      <header className="prancha__topo">
        <Logotipo className="prancha__logo" role="img" aria-label="Adugo" />
        <h1 className="visually-hidden">Prancha de arte do Adugo</h1>
        <p>Prancha de arte: tudo que aparece no jogo, sobre o chão, no tamanho de celular e no dobro.</p>
        <button type="button" className="botao botao--secundario" aria-pressed={parado} onClick={() => setParado(!parado)}>
          Pausar animações
        </button>
      </header>

      <section>
        <h2>Peças</h2>
        <div className="prancha__fila">
          <Amostra nome="cachorro-a" Arte={CachorroA} unidades={56} />
          <Amostra nome="cachorro-b" Arte={CachorroB} unidades={56} />
          <Amostra nome="cachorro-c" Arte={CachorroC} unidades={56} />
          <Amostra nome="onca" Arte={Onca} unidades={72} />
        </div>
      </section>

      <section>
        <h2>Fogo e vida</h2>
        <div className="prancha__fila">
          <Amostra nome="foco, aviso 2" Arte={Foco} unidades={84} className="foco--aviso-2" />
          <Amostra nome="foco, aviso 1" Arte={Foco} unidades={84} className="foco--aviso-1" />
          <Amostra nome="queimado" Arte={Queimado} unidades={96} />
          <Amostra nome="fumaca" Arte={Fumaca} unidades={84} />
          <Amostra nome="broto" Arte={Broto} unidades={36} />
          <Amostra nome="capim" Arte={Capim} unidades={48} />
        </div>
      </section>

      <section>
        <h2>Tabuleiro</h2>
        <div className="prancha__fila prancha__fila--tabuleiros">
          <figure className="amostra">
            <Tabuleiro
              className="prancha__tabuleiro-celular"
              onca={P(2, 2)}
              caes={[...JOGO.caes.slice(0, 11), P(2, 3), P(2, 4), null]}
              queimados={[P(3, 0)]}
              foco={{ ponto: P(4, 3), aviso: 1 }}
            />
            <figcaption>Menor celular (318 px), foco com aviso 1</figcaption>
          </figure>
          <figure className="amostra">
            <Tabuleiro
              className="prancha__tabuleiro-grande"
              {...JOGO}
              foco={{ ponto: P(4, 1), aviso: 2 }}
              selecionado={P(3, 2)}
              destinos={[
                { ponto: P(4, 2), captura: false },
                { ponto: P(3, 1), captura: false },
                { ponto: P(3, 4), captura: true },
              ]}
              ultimaJogada={{ de: P(2, 4), para: P(3, 3) }}
              aoTocar={setTocado}
            />
            <figcaption>
              Onça selecionada, dois destinos, uma captura, foco com aviso 2, dois pontos queimados.{' '}
              {tocado ? `Último toque: ${tocado}.` : 'Toque em um ponto para testar a área de toque.'}
            </figcaption>
          </figure>
        </div>
      </section>

      <section>
        <h2>Capa e ícone do site</h2>
        <div className="prancha__fila">
          <figure className="amostra">
            <img className="prancha__capa" src={capaUrl} alt="Capa: a pedra da onça e cinco cachorros num canto do tabuleiro riscado no chão, com um foco de calor à direita" />
            <figcaption>capa · 1200 × 900</figcaption>
          </figure>
          <figure className="amostra">
            <div className="amostra__tamanhos">
              <img src="/favicon.svg" width={16} height={16} alt="" />
              <img src="/favicon.svg" width={32} height={32} alt="" />
              <img src="/favicon.svg" width={96} height={96} alt="" />
            </div>
            <figcaption>favicon · 16, 32 e 96 px</figcaption>
          </figure>
        </div>
      </section>

      <section>
        <h2>Ícones</h2>
        <div className="prancha__fila">
          {ICONES.map(([nome, Icone]) => (
            <figure key={nome} className="amostra amostra--icone">
              <div className="amostra__tamanhos">
                <Icone width={24} height={24} aria-hidden="true" />
                <Icone width={32} height={32} aria-hidden="true" />
              </div>
              <figcaption>{nome}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h2>Botões e cartas</h2>
        <div className="prancha__fila">
          <button type="button" className="botao">
            Jogar com o fogo
          </button>
          <button type="button" className="botao botao--secundario">
            <IconeRegras aria-hidden="true" />
            Como se joga
          </button>
          <button type="button" className="botao botao--secundario" onClick={() => setCartaAberta(exemploQueimada)}>
            Abrir modal de carta
          </button>
        </div>
        <div className="prancha__fila prancha__fila--cartas">
          <CartaoCarta carta={exemploQueimada} aoContinuar={() => setCartaAberta(exemploQueimada)} />
          <CartaoCarta carta={exemploCuidado} />
          <CartaoCarta carta={exemploOnca} />
        </div>
        <ModalCarta carta={cartaAberta} aoFechar={() => setCartaAberta(null)} />
      </section>

      <section>
        <h2>Paleta</h2>
        <div className="prancha__paleta painel">
          {PALETA.map(([grupo, tokens]) => (
            <div key={grupo} className="prancha__grupo">
              <h3>{grupo}</h3>
              {tokens.map((t) => (
                <div key={t} className="prancha__cor">
                  <span style={{ background: `var(--${t})` }} />
                  {t}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Tipografia</h2>
        <div className="prancha__tipos painel">
          <h1>Território da Onça</h1>
          <p>Texto corrido em Nunito. Uma onça enfrenta 14 cachorros num chão que está queimando.</p>
          <p className="carta__texto">Texto de carta em Nunito 700.</p>
        </div>
      </section>
    </main>
  );
}
