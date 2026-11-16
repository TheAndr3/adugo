// Tela "Como se joga" (docs/ESTETICA.md, seção 10, item 2).
// Quatro passos didáticos (Andar, Capturar, Cercar, Apagar o fogo), cada um com
// um mini tabuleiro animado e interativo usando o componente real <Tabuleiro /> e o motor.

import { useEffect, useState } from 'react';
import { IconeChama, IconeReiniciar, IconeVoltar, Logotipo } from '../arte';
import { Tabuleiro, type Destino } from '../componentes/Tabuleiro';
import { aplicar, criarEstado, ponto as P, type Estado, type Modo, type Ponto } from '../motor';
import './Telas.css';

export interface QuadroDemo {
  readonly estado: Estado;
  readonly selecionado: Ponto | null;
  readonly destinos: readonly Destino[];
  readonly ultimaJogada: { readonly de: Ponto; readonly para: Ponto } | null;
  readonly legenda: string;
}

export interface PassoComoJogar {
  readonly id: 'andar' | 'capturar' | 'cercar' | 'fogo';
  readonly numero: number;
  readonly titulo: string;
  readonly resumo: string;
  readonly detalhe: string;
  readonly quadros: readonly QuadroDemo[];
}

function montarPassos(): readonly PassoComoJogar[] {
  // 1. Andar
  const andar0 = criarEstado({ modo: 'classico' });
  const andar1 = aplicar(andar0, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;
  const andar2 = aplicar(andar1, { tipo: 'mover', de: P(2, 1), para: P(2, 2) }).estado;

  // 2. Capturar (com cadeia)
  const cap0 = criarEstado({
    modo: 'classico',
    onca: P(2, 0),
    caes: [P(2, 1), P(2, 3), P(0, 1), P(0, 2), P(0, 3), P(1, 1), P(1, 3)],
  });
  const cap1 = aplicar(cap0, {
    tipo: 'pular',
    de: P(2, 0),
    sobre: P(2, 1),
    para: P(2, 2),
  }).estado;
  const cap2 = aplicar(cap1, {
    tipo: 'pular',
    de: P(2, 2),
    sobre: P(2, 3),
    para: P(2, 4),
  }).estado;

  // 3. Cercar
  const cerco0 = criarEstado({
    modo: 'territorio',
    vez: 'caes',
    onca: P(6, 0),
    caes: [P(5, 1), P(4, 2), P(6, 4), P(5, 2), P(3, 1), P(3, 3)],
    queimados: [P(0, 4)],
  });
  const cerco1 = aplicar(cerco0, { tipo: 'mover', de: P(5, 2), para: P(6, 2) }).estado;

  // 4. Apagar o fogo
  const fogo0 = criarEstado({
    modo: 'territorio',
    vez: 'caes',
    onca: P(4, 2),
    caes: [P(2, 2), P(1, 1), P(1, 3), P(2, 0), P(2, 4)],
    queimados: [P(0, 0), P(4, 4)],
    foco: { ponto: P(3, 2), aviso: 2 },
  });
  const fogo1: Estado = {
    ...fogo0,
    foco: { ponto: P(3, 2), aviso: 1 },
  };
  const fogo2 = aplicar(fogo1, { tipo: 'mover', de: P(2, 2), para: P(3, 2) }).estado;

  return [
    {
      id: 'andar',
      numero: 1,
      titulo: '1. Andar pelas linhas',
      resumo:
        'A onça começa no centro e os 14 cachorros no topo. A onça joga primeiro; depois os cachorros. Na sua vez, mova uma peça para um ponto vizinho vazio seguindo qualquer linha riscada no chão.',
      detalhe: 'Os cachorros podem andar em qualquer direção (para frente, para trás, para os lados e nas diagonais marcadas). Não é permitido passar a vez.',
      quadros: [
        {
          estado: andar0,
          selecionado: P(2, 2),
          destinos: [
            { ponto: P(3, 1), captura: false },
            { ponto: P(3, 2), captura: false },
            { ponto: P(3, 3), captura: false },
          ],
          ultimaJogada: null,
          legenda: 'Vez da onça: escolha um dos 3 pontos vizinhos vazios.',
        },
        {
          estado: andar1,
          selecionado: P(2, 1),
          destinos: [
            { ponto: P(2, 2), captura: false },
            { ponto: P(3, 1), captura: false },
          ],
          ultimaJogada: { de: P(2, 2), para: P(3, 2) },
          legenda: 'A onça desceu para (4,3). Agora é a vez de um cachorro avançar.',
        },
        {
          estado: andar2,
          selecionado: null,
          destinos: [],
          ultimaJogada: { de: P(2, 1), para: P(2, 2) },
          legenda: 'O cachorro ocupou o centro do tabuleiro.',
        },
      ],
    },
    {
      id: 'capturar',
      numero: 2,
      titulo: '2. Capturar (Onça)',
      resumo:
        'Só a onça captura. Ela pula por cima de um cachorro vizinho e cai no ponto vazio logo depois, na mesma linha reta. Se houver outro pulo a partir dali, pode continuar pulando na mesma jogada.',
      detalhe:
        'Capturar não é obrigatório, e a onça pode encerrar a cadeia quando quiser. Se capturar 5 cachorros, a onça vence imediatamente!',
      quadros: [
        {
          estado: cap0,
          selecionado: P(2, 0),
          destinos: [{ ponto: P(2, 2), captura: true }],
          ultimaJogada: null,
          legenda: 'Anel tracejado indica pouso de captura sobre o cachorro vizinho.',
        },
        {
          estado: cap1,
          selecionado: P(2, 2),
          destinos: [{ ponto: P(2, 4), captura: true }],
          ultimaJogada: { de: P(2, 0), para: P(2, 2) },
          legenda: '1ª captura feita! Em cadeia, a onça pode pular o próximo cachorro.',
        },
        {
          estado: cap2,
          selecionado: P(2, 4),
          destinos: [],
          ultimaJogada: { de: P(2, 2), para: P(2, 4) },
          legenda: '2 cachorros capturados numa única jogada da onça!',
        },
      ],
    },
    {
      id: 'cercar',
      numero: 3,
      titulo: '3. Cercar a onça (Cachorros)',
      resumo:
        'Os cachorros não capturam: vencem cercando a onça até deixá-la sem nenhum passo e sem nenhum pulo possível.',
      detalhe:
        'Regra do cerco com fogo: os cachorros só vencem se cercarem a onça sozinhos. Se um ponto queimado estiver fechando uma saída ou pouso dela, ninguém vence!',
      quadros: [
        {
          estado: cerco0,
          selecionado: P(5, 2),
          destinos: [{ ponto: P(6, 2), captura: false }],
          ultimaJogada: null,
          legenda: 'A onça está no canto da toca. Falta fechar a última saída em (7,3).',
        },
        {
          estado: cerco1,
          selecionado: null,
          destinos: [],
          ultimaJogada: { de: P(5, 2), para: P(6, 2) },
          legenda: 'Cerco limpo completo! A onça não tem para onde ir nem pular: cachorros vencem.',
        },
      ],
    },
    {
      id: 'fogo',
      numero: 4,
      titulo: '4. Apagar o fogo e salvar o território',
      resumo:
        'No modo Território da Onça, focos de calor surgem com 2 rodadas de aviso (duas brasinhas). Qualquer peça que parar no ponto do foco apaga o fogo!',
      detalhe:
        'Se o aviso acabar sem ninguém ali, o ponto queima e fica bloqueado até o fim. Com 5 pontos queimados, o território é destruído e os dois jogadores perdem.',
      quadros: [
        {
          estado: fogo0,
          selecionado: P(2, 2),
          destinos: [{ ponto: P(3, 2), captura: false }],
          ultimaJogada: null,
          legenda: 'Foco com aviso 2 (chama menor e duas brasinhas).',
        },
        {
          estado: fogo1,
          selecionado: P(2, 2),
          destinos: [{ ponto: P(3, 2), captura: false }],
          ultimaJogada: null,
          legenda: 'Aviso 1 (chama cresce e resta uma brasinha): última rodada antes de queimar!',
        },
        {
          estado: fogo2,
          selecionado: P(3, 2),
          destinos: [],
          ultimaJogada: { de: P(2, 2), para: P(3, 2) },
          legenda: 'O cachorro parou no foco, apagou as chamas e protegeu o território!',
        },
      ],
    },
  ];
}

export const PASSOS_COMO_JOGAR: readonly PassoComoJogar[] = montarPassos();

interface MiniTabuleiroPassoProps {
  readonly passo: PassoComoJogar;
  readonly animacaoPausada: boolean;
}

function MiniTabuleiroPasso({ passo, animacaoPausada }: MiniTabuleiroPassoProps) {
  const [indice, setIndice] = useState(0);
  const total = passo.quadros.length;
  const quadro = passo.quadros[indice] ?? passo.quadros[0]!;

  useEffect(() => {
    if (animacaoPausada) return;
    const prefereMenosMovimento =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefereMenosMovimento) return;

    const timer = window.setInterval(() => {
      setIndice((atual) => (atual + 1) % total);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [animacaoPausada, total]);

  function avancarOuReiniciar(): void {
    setIndice((atual) => (atual + 1) % total);
  }

  return (
    <article className="painel como-jogar__passo">
      <div className="como-jogar__texto">
        <h2>{passo.titulo}</h2>
        <p>{passo.resumo}</p>
        <p className="como-jogar__detalhe">{passo.detalhe}</p>
        <div className="como-jogar__controles">
          <span className="como-jogar__etapa" aria-live="polite">
            Demonstração ({indice + 1}/{total}): {quadro.legenda}
          </span>
          <button
            type="button"
            className="botao botao--secundario como-jogar__botao-passo"
            onClick={avancarOuReiniciar}
          >
            <IconeReiniciar aria-hidden="true" />
            {indice + 1 < total ? 'Ver próximo lance' : 'Recomeçar demonstração'}
          </button>
        </div>
      </div>

      <figure className="como-jogar__palco">
        <Tabuleiro
          className="como-jogar__tabuleiro"
          onca={quadro.estado.onca}
          caes={quadro.estado.caes}
          queimados={quadro.estado.queimados}
          foco={quadro.estado.foco}
          selecionado={quadro.selecionado}
          destinos={quadro.destinos}
          ultimaJogada={quadro.ultimaJogada}
          aoTocar={() => avancarOuReiniciar()}
        />
      </figure>
    </article>
  );
}

export interface TelaComoJogarProps {
  readonly aoVoltar: () => void;
  readonly aoIniciarPartida: (modo: Modo) => void;
}

export function TelaComoJogar({ aoVoltar, aoIniciarPartida }: TelaComoJogarProps) {
  const [parado, setParado] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.movimento === 'parado',
  );

  useEffect(() => {
    if (parado) document.documentElement.dataset.movimento = 'parado';
    else delete document.documentElement.dataset.movimento;
  }, [parado]);

  return (
    <main className="tela">
      <header className="tela__topo">
        <div>
          <Logotipo
            style={{ width: 'min(100%, 240px)', height: 'auto', display: 'block' }}
            role="img"
            aria-label="Adugo"
          />
          <h1>Como se joga</h1>
        </div>
        <div className="fim__acoes">
          <button
            type="button"
            className="botao botao--secundario"
            aria-pressed={parado}
            onClick={() => setParado((p) => !p)}
          >
            Pausar animações
          </button>
          <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
            <IconeVoltar aria-hidden="true" />
            Voltar ao início
          </button>
        </div>
      </header>

      <div className="como-jogar__lista">
        {PASSOS_COMO_JOGAR.map((passo) => (
          <MiniTabuleiroPasso key={passo.id} passo={passo} animacaoPausada={parado} />
        ))}
      </div>

      <footer className="fim__acoes">
        <button type="button" className="botao" onClick={() => aoIniciarPartida('territorio')}>
          <IconeChama aria-hidden="true" />
          Jogar com o fogo
        </button>
        <button
          type="button"
          className="botao botao--secundario"
          onClick={() => aoIniciarPartida('classico')}
        >
          Jogar Adugo clássico
        </button>
        <button type="button" className="botao botao--secundario" onClick={aoVoltar}>
          <IconeVoltar aria-hidden="true" />
          Início
        </button>
      </footer>
    </main>
  );
}
