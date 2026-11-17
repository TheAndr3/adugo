// O tabuleiro riscado no chão (docs/ESTETICA.md, seção 4). Só desenha: recebe a posição
// e avisa qual ponto foi tocado. Quem decide o que o toque significa é a tela da partida.

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Broto, CACHORROS, Capim, Foco as FocoArte, Fumaca, Onca, Queimado } from '../arte';
import { PONTOS, coordenadas, type Foco, type Ponto } from '../motor';
import { ALTURA, LARGURA, TRECHOS, posicao } from './sulcos';
import './Tabuleiro.css';

export interface Destino {
  readonly ponto: Ponto;
  /** O destino é o pouso de um pulo de captura. */
  readonly captura: boolean;
}

/** Algo que acabou de acontecer num ponto e que o tabuleiro encena uma vez. O `id` muda a cada vez. */
export type EfeitoTabuleiro =
  | { readonly id: number; readonly tipo: 'captura'; readonly ponto: Ponto; readonly cao: number }
  | { readonly id: number; readonly tipo: 'apagado'; readonly ponto: Ponto }
  | { readonly id: number; readonly tipo: 'queimou'; readonly ponto: Ponto };

/** A peça que acabou de se mover: sobe um pouco no caminho, ou bastante se foi um pulo de captura. */
export interface Salto {
  readonly id: number;
  readonly peca: 'onca' | number;
  readonly pulo: boolean;
}

export interface TabuleiroProps {
  readonly onca: Ponto;
  /** Posição de cada cachorro pelo índice; `null` se foi capturado. */
  readonly caes: readonly (Ponto | null)[];
  readonly queimados?: readonly Ponto[];
  readonly foco?: Foco | null;
  /** Ponto da peça selecionada. */
  readonly selecionado?: Ponto | null;
  readonly destinos?: readonly Destino[];
  readonly ultimaJogada?: { readonly de: Ponto; readonly para: Ponto } | null;
  readonly efeitos?: readonly EfeitoTabuleiro[];
  readonly salto?: Salto | null;
  /** Se presente, os pontos viram botões: toque, clique, Enter e Espaço. As setas andam entre os pontos. */
  readonly aoTocar?: (ponto: Ponto) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const TAMANHO_CAO = 56;
const TAMANHO_ONCA = 72;
const TAMANHO_FOCO = 96;
const TAMANHO_QUEIMADO = 96;
/** Pequena variação de tamanho entre os cachorros, fixa pelo índice. */
const ESCALAS = [1, 0.95, 1.04, 0.97, 1.02] as const;

const TUFOS = [
  { x: 86, y: 512, giro: -8 },
  { x: 386, y: 508, giro: 10 },
  { x: 14, y: 672, giro: -4 },
] as const;

interface Direcao {
  readonly dx: number;
  readonly dy: number;
}

const DIRECOES: Readonly<Record<string, Direcao>> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

/** O ponto mais próximo naquela direção, preferindo quem está mais alinhado. */
export function vizinhoNaDirecao(de: Ponto, direcao: Direcao): Ponto | null {
  const origem = posicao(de);
  let melhor: Ponto | null = null;
  let menor = Infinity;
  for (const p of PONTOS) {
    const { x, y } = posicao(p);
    const aFrente = (x - origem.x) * direcao.dx + (y - origem.y) * direcao.dy;
    if (aFrente <= 0) continue;
    const deLado = Math.abs((x - origem.x) * direcao.dy) + Math.abs((y - origem.y) * direcao.dx);
    const custo = aFrente + 2 * deLado;
    if (custo < menor) {
      menor = custo;
      melhor = p;
    }
  }
  return melhor;
}

function Sulcos({ d, className }: { d: string; className: string }) {
  if (!d) return null;
  return (
    <g className={className}>
      <path className="sulco__borda" d={d} />
      <path className="sulco__fundo" d={d} />
      <path className="sulco__sombra" d={d} />
    </g>
  );
}

export function Tabuleiro({
  onca,
  caes,
  queimados = [],
  foco = null,
  selecionado = null,
  destinos = [],
  ultimaJogada = null,
  efeitos = [],
  salto = null,
  aoTocar,
  ariaLabel = 'Tabuleiro do Adugo',
  className,
}: TabuleiroProps) {
  const svg = useRef<SVGSVGElement>(null);
  // Só um ponto fica na ordem do Tab; as setas levam o foco do teclado aos outros.
  const [cursor, setCursor] = useState<Ponto>(onca);
  const queimado = new Set(queimados);
  const vivos = trechosPor(false, queimado);
  const mortos = trechosPor(true, queimado);

  function rotulo(p: Ponto): string {
    const { r, c } = coordenadas(p);
    let oQue = 'vazio';
    if (p === onca) oQue = 'onça';
    else if (caes.includes(p)) oQue = 'cachorro';
    else if (queimado.has(p)) oQue = 'ponto queimado';
    else if (foco?.ponto === p) {
      oQue = `foco de calor, queima em ${foco.aviso} ${foco.aviso === 1 ? 'rodada' : 'rodadas'}`;
    }
    const destino = destinos.find((d) => d.ponto === p);
    const extra = destino ? (destino.captura ? ', captura possível' : ', destino possível') : '';
    const marcada = p === selecionado ? ', selecionada' : '';
    return `Fileira ${r + 1}, coluna ${c + 1}: ${oQue}${marcada}${extra}`;
  }

  function aoBaixarTecla(evento: KeyboardEvent, p: Ponto): void {
    const direcao = DIRECOES[evento.key];
    if (direcao) {
      evento.preventDefault();
      const proximo = vizinhoNaDirecao(p, direcao);
      if (proximo) {
        setCursor(proximo);
        svg.current?.querySelector<SVGElement>(`[data-ponto="${proximo}"]`)?.focus();
      }
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      aoTocar?.(p);
    } else if (evento.key === ' ') {
      evento.preventDefault();
    }
  }

  function aoSoltarTecla(evento: KeyboardEvent, p: Ponto): void {
    if (evento.key !== ' ') return;
    evento.preventDefault();
    aoTocar?.(p);
  }

  const de = ultimaJogada ? posicao(ultimaJogada.de) : null;
  const para = ultimaJogada ? posicao(ultimaJogada.para) : null;

  return (
    <svg
      ref={svg}
      className={['tabuleiro', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role={aoTocar ? 'group' : 'img'}
      aria-label={ariaLabel}
    >
      <g aria-hidden="true">
        <polygon className="tabuleiro__toca" points="260,460 60,660 460,660" />
        {TUFOS.map((t) => (
          <Capim
            key={`${t.x}-${t.y}`}
            x={t.x}
            y={t.y}
            width={48}
            height={36}
            transform={`rotate(${t.giro} ${t.x + 24} ${t.y + 36})`}
          />
        ))}

        <Sulcos className="sulcos" d={vivos} />
        <Sulcos className="sulcos sulcos--apagados" d={mortos} />

        {PONTOS.map((p) => {
          const { x, y } = posicao(p);
          return (
            <g key={p} transform={`translate(${x} ${y})`}>
              <circle className="covinha" r={10} />
              <path className="covinha__brilho" d="M9.5 3.5A10 10 0 0 1 3.5 9.5" />
            </g>
          );
        })}

        {de && para && <line className="trilha" x1={de.x} y1={de.y} x2={para.x} y2={para.y} />}

        {queimados.map((p) => {
          const { x, y } = posicao(p);
          const { r, c } = coordenadas(p);
          const meio = TAMANHO_QUEIMADO / 2;
          return (
            <g key={p} className="queimado" transform={`translate(${x} ${y}) rotate(${(r * 5 + c) * 67})`}>
              <Queimado x={-meio} y={-meio} width={TAMANHO_QUEIMADO} height={TAMANHO_QUEIMADO} />
            </g>
          );
        })}

        {destinos.map(({ ponto, captura }) => {
          const { x, y } = posicao(ponto);
          return (
            <g key={ponto} className="destino" transform={`translate(${x} ${y})`}>
              {captura && <circle className="destino__captura" r={22} />}
              <circle className="destino__disco" r={12} />
            </g>
          );
        })}

        {foco && (
          <g
            key={foco.ponto}
            className={`foco foco--aviso-${Math.min(foco.aviso, 2)}`}
            transform={`translate(${posicao(foco.ponto).x} ${posicao(foco.ponto).y})`}
          >
            <g className="foco__entrada">
              <FocoArte x={-TAMANHO_FOCO / 2} y={-TAMANHO_FOCO / 2} width={TAMANHO_FOCO} height={TAMANHO_FOCO} />
            </g>
          </g>
        )}

        {caes.map((p, i) => {
          if (p === null) return null;
          const { x, y } = posicao(p);
          const Seixo = CACHORROS[i % CACHORROS.length]!;
          const tamanho = TAMANHO_CAO * ESCALAS[i % ESCALAS.length]!;
          return (
            <Peca
              key={i}
              x={x}
              y={y}
              tamanho={tamanho}
              selecionada={p === selecionado}
              salto={salto?.peca === i ? salto : null}
            >
              <Seixo x={-tamanho / 2} y={-tamanho / 2} width={tamanho} height={tamanho} />
            </Peca>
          );
        })}

        <Peca
          x={posicao(onca).x}
          y={posicao(onca).y}
          tamanho={TAMANHO_ONCA}
          selecionada={onca === selecionado}
          salto={salto?.peca === 'onca' ? salto : null}
        >
          <Onca x={-TAMANHO_ONCA / 2} y={-TAMANHO_ONCA / 2} width={TAMANHO_ONCA} height={TAMANHO_ONCA} />
        </Peca>

        {efeitos.map((efeito) => (
          <Efeito key={efeito.id} efeito={efeito} />
        ))}
      </g>

      {aoTocar &&
        PONTOS.map((p) => {
          const { x, y } = posicao(p);
          return (
            <circle
              key={p}
              className="tabuleiro__toque"
              cx={x}
              cy={y}
              r={38}
              role="button"
              data-ponto={p}
              tabIndex={p === cursor ? 0 : -1}
              aria-label={rotulo(p)}
              onFocus={() => setCursor(p)}
              onClick={() => aoTocar(p)}
              onKeyDown={(evento) => aoBaixarTecla(evento, p)}
              onKeyUp={(evento) => aoSoltarTecla(evento, p)}
            />
          );
        })}
    </svg>
  );
}

function trechosPor(apagados: boolean, queimado: ReadonlySet<Ponto>): string {
  return TRECHOS.filter((t) => (queimado.has(t.a) || queimado.has(t.b)) === apagados)
    .map((t) => t.d)
    .join('');
}

/** O que acabou de acontecer num ponto, desenhado por cima das peças e animado pelo CSS. */
function Efeito({ efeito }: { efeito: EfeitoTabuleiro }) {
  const { x, y } = posicao(efeito.ponto);
  const lugar = `translate(${x} ${y})`;

  if (efeito.tipo === 'captura') {
    const Seixo = CACHORROS[efeito.cao % CACHORROS.length]!;
    const tamanho = TAMANHO_CAO * ESCALAS[efeito.cao % ESCALAS.length]!;
    return (
      <g className="efeito efeito-captura" transform={lugar}>
        <g className="efeito-captura__pedra">
          <Seixo x={-tamanho / 2} y={-tamanho / 2} width={tamanho} height={tamanho} />
        </g>
        <circle className="efeito-captura__po efeito-captura__po--1" cx={-14} cy={6} r={5} />
        <circle className="efeito-captura__po efeito-captura__po--2" cx={12} cy={10} r={4} />
        <circle className="efeito-captura__po efeito-captura__po--3" cx={2} cy={-12} r={4.5} />
      </g>
    );
  }

  if (efeito.tipo === 'apagado') {
    return (
      <g className="efeito efeito-apagado" transform={lugar}>
        <Fumaca className="fumaca--subindo" x={-42} y={-78} width={84} height={84} />
        <g className="efeito-apagado__broto">
          <Broto x={18} y={-52} width={36} height={36} />
        </g>
      </g>
    );
  }

  return (
    <g className="efeito efeito-queima foco--aviso-1" transform={lugar}>
      <circle className="efeito-queima__clarao" r={46} />
      <g className="efeito-queima__chama">
        <FocoArte x={-TAMANHO_FOCO / 2} y={-TAMANHO_FOCO / 2} width={TAMANHO_FOCO} height={TAMANHO_FOCO} />
      </g>
    </g>
  );
}

interface PecaProps {
  readonly x: number;
  readonly y: number;
  readonly tamanho: number;
  readonly selecionada: boolean;
  readonly salto?: Salto | null;
  readonly children: ReactNode;
}

/** Uma pedra no chão: a sombra é do tabuleiro, para crescer quando a peça é levantada. */
function Peca({ x, y, tamanho, selecionada, salto = null, children }: PecaProps) {
  const raio = tamanho / 2;
  const classes = ['peca', selecionada && 'peca--selecionada', salto?.pulo && 'peca--pulo'].filter(Boolean).join(' ');
  const pedra = salto ? (salto.pulo ? 'peca__pedra peca__pedra--pulo' : 'peca__pedra peca__pedra--passo') : 'peca__pedra';
  return (
    <g className={classes} style={{ translate: `${x}px ${y}px` }}>
      <ellipse className="peca__sombra" rx={raio * 0.92} ry={raio * 0.84} />
      {selecionada && (
        <>
          <circle className="peca__anel-fora" r={raio + 9} />
          <circle className="peca__anel-dentro" r={raio + 6.5} />
        </>
      )}
      {/* A chave nova a cada movimento faz a animação do salto recomeçar. */}
      <g key={salto?.id ?? 0} className={pedra}>
        {children}
      </g>
    </g>
  );
}
