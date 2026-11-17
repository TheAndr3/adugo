// Tela da partida (docs/ESTETICA.md, seções 6, 9 e 10): liga o motor ao tabuleiro, encena
// cada jogada, abre as cartas e, no fim, entrega o estado final para a tela de fim.

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconePausar, IconeVoltar } from '../arte';
import { ConfirmarSaida } from '../componentes/ConfirmarSaida';
import { ModalCarta } from '../componentes/ModalCarta';
import { IndicadorDeVez, InfoRodada, PlacarCapturas, PlacarTerritorio } from '../componentes/PainelPartida';
import { Tabuleiro, type EfeitoTabuleiro, type Salto } from '../componentes/Tabuleiro';
import { extrairCartaDaJogada, type BaralhoSessao, type Carta } from '../conteudo';
import { aplicar, novaPartida, proximoFocoEm, type Estado, type Jogada, type Modo, type Ponto } from '../motor';
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
import { tituloDoResultado } from './TelaFim';
import './TelaPartida.css';

export interface TelaPartidaProps {
  readonly modo: Modo;
  /** Baralho da sessão, já preparado para esta partida. */
  readonly baralhoInicial: BaralhoSessao;
  /** Chamado depois da última animação, com o estado final e o baralho como ficou. */
  readonly aoTerminar: (estado: Estado, baralho: BaralhoSessao) => void;
  readonly aoSair: () => void;
}

/** Tempo com o tabuleiro final à vista antes de ir para a tela de fim. */
const PAUSA_FINAL = 1100;
/** O sumiço dos efeitos mais longos (o broto dura 1,5 s). */
const VIDA_DOS_EFEITOS = 1700;

export function TelaPartida({ modo, baralhoInicial, aoTerminar, aoSair }: TelaPartidaProps) {
  const [estado, setEstado] = useState<Estado>(() => novaPartida({ modo, semente: Date.now() >>> 0 }).estado);
  const [baralho, setBaralho] = useState(baralhoInicial);
  const [selecionado, setSelecionado] = useState<Ponto | null>(() => selecaoInicial(estado));
  const [ultimaJogada, setUltimaJogada] = useState<{ de: Ponto; para: Ponto } | null>(null);
  const [efeitos, setEfeitos] = useState<readonly EfeitoTabuleiro[]>([]);
  const [salto, setSalto] = useState<Salto | null>(null);
  const [carta, setCarta] = useState<Carta | null>(null);
  /** Enquanto uma jogada é encenada ou uma carta está aberta, o tabuleiro não aceita toque. */
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [parado, setParado] = useState(false);
  const [perguntandoSaida, setPerguntandoSaida] = useState(false);

  const proximoId = useRef(0);
  const temporizadores = useRef(new Set<number>());
  const limparEfeitos = useRef<number | null>(null);
  /** O que fazer quando a carta aberta for fechada. */
  const depoisDaCarta = useRef<(() => void) | null>(null);

  const depois = useCallback((ms: number, acao: () => void): number => {
    const id = window.setTimeout(() => {
      temporizadores.current.delete(id);
      acao();
    }, ms);
    temporizadores.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const pendentes = temporizadores.current;
    return () => {
      for (const id of pendentes) window.clearTimeout(id);
      pendentes.clear();
    };
  }, []);

  useEffect(() => {
    if (parado) document.documentElement.dataset.movimento = 'parado';
    else delete document.documentElement.dataset.movimento;
    return () => {
      delete document.documentElement.dataset.movimento;
    };
  }, [parado]);

  function jogar(jogada: Jogada): void {
    const passo = aplicar(estado, jogada);
    const novo = passo.estado;
    const cartas = extrairCartaDaJogada(baralho, passo.eventos, { modo, config: novo.config, emCadeia: novo.emCadeia });
    const cena = encenar(passo.eventos, () => ++proximoId.current);

    setEstado(novo);
    setBaralho(cartas.baralho);
    setSelecionado(selecaoInicial(novo));
    setAviso(anunciar(passo.eventos, novo));
    if (cena.ultimaJogada) setUltimaJogada(cena.ultimaJogada);
    setSalto(cena.salto);

    if (cena.efeitos.length > 0) {
      setEfeitos(cena.efeitos);
      if (limparEfeitos.current !== null) window.clearTimeout(limparEfeitos.current);
      limparEfeitos.current = depois(VIDA_DOS_EFEITOS, () => setEfeitos([]));
    }

    const seguir = (): void => {
      if (novo.resultado) {
        setAviso(tituloDoResultado(novo.resultado));
        depois(PAUSA_FINAL, () => aoTerminar(novo, cartas.baralho));
      } else {
        setOcupado(false);
      }
    };

    if (cena.espera === 0 && !cartas.carta && !novo.resultado) return;
    setOcupado(true);
    depois(cena.espera, () => {
      if (cartas.carta) {
        depoisDaCarta.current = seguir;
        setCarta(cartas.carta);
      } else {
        seguir();
      }
    });
  }

  function aoTocar(ponto: Ponto): void {
    if (ocupado || carta) return;
    const toque = interpretarToque(estado, selecionado, ponto);
    if (!toque) return;
    if (toque.tipo === 'jogar') jogar(toque.jogada);
    else setSelecionado(toque.ponto);
  }

  function aoFecharCarta(): void {
    setCarta(null);
    const seguir = depoisDaCarta.current;
    depoisDaCarta.current = null;
    seguir?.();
  }

  function sair(): void {
    if (precisaConfirmarSaida(estado)) setPerguntandoSaida(true);
    else aoSair();
  }

  const acabou = estado.resultado !== null;
  const texto = acabou ? tituloDoResultado(estado.resultado) : textoDaVez(estado);
  const emCadeia = estado.emCadeia && !acabou;
  const nomeDoModo = modo === 'territorio' ? 'Território da Onça' : 'Adugo clássico';

  return (
    <main className={`partida partida--${modo}`}>
      <h1 className="visually-hidden">Partida: {nomeDoModo}</h1>

      <div className={emCadeia ? 'partida__vez partida__vez--cadeia' : 'partida__vez'}>
        <IndicadorDeVez estado={estado} texto={texto} />
        {emCadeia && (
          <button type="button" className="botao partida__encerrar" disabled={ocupado} onClick={() => jogar({ tipo: 'encerrar' })}>
            Encerrar jogada
          </button>
        )}
      </div>

      <div className="partida__acoes">
        <button
          type="button"
          className="botao botao--secundario partida__botao"
          aria-pressed={parado}
          onClick={() => setParado((p) => !p)}
        >
          <IconePausar aria-hidden="true" />
          <span className="partida__rotulo">Pausar animações</span>
        </button>
        <button type="button" className="botao botao--secundario partida__botao" onClick={sair}>
          <IconeVoltar aria-hidden="true" />
          <span className="partida__rotulo">Sair da partida</span>
        </button>
      </div>

      <div className="partida__palco">
        <Tabuleiro
          ariaLabel={`Tabuleiro. ${texto}. Use as setas para andar entre os pontos.`}
          onca={estado.onca}
          caes={estado.caes}
          queimados={estado.queimados}
          foco={estado.foco}
          selecionado={acabou ? null : selecionado}
          destinos={ocupado || acabou ? [] : destinosDe(estado, selecionado)}
          ultimaJogada={ultimaJogada}
          efeitos={efeitos}
          salto={salto}
          aoTocar={aoTocar}
        />
      </div>

      <div className="partida__placar">
        <PlacarCapturas estado={estado} className="partida__capturas" />
        {modo === 'territorio' && <PlacarTerritorio estado={estado} className="partida__territorio" />}
        <InfoRodada rodada={estado.rodada} fogo={textoDoFogo(estado, proximoFocoEm(estado))} className="partida__rodada" />
      </div>

      <p className="visually-hidden" aria-live="polite">
        {aviso}
      </p>

      <ModalCarta carta={carta} aoFechar={aoFecharCarta} />
      <ConfirmarSaida aberto={perguntandoSaida} aoSair={aoSair} aoContinuar={() => setPerguntandoSaida(false)} />

      {estado.resultado?.tipo === 'territorio' && <div className="partida__escurece" aria-hidden="true" />}
    </main>
  );
}
