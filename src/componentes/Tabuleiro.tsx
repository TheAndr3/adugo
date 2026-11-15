// O tabuleiro riscado no chão (docs/ESTETICA.md, seção 4). Só desenha: recebe a posição
// e avisa qual ponto foi tocado. Quem decide o que o toque significa é a tela da partida.

import type { KeyboardEvent, ReactNode } from 'react';
import { CACHORROS, Capim, Foco as FocoArte, Onca, Queimado } from '../arte';
import { PONTOS, coordenadas, type Foco, type Ponto } from '../motor';
import { ALTURA, LARGURA, TRECHOS, posicao } from './sulcos';
import './Tabuleiro.css';

export interface Destino {
  readonly ponto: Ponto;
  /** O destino é o pouso de um pulo de captura. */
  readonly captura: boolean;
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
  /** Se presente, os pontos viram botões (toque, clique e teclado). */
  readonly aoTocar?: (ponto: Ponto) => void;
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
  aoTocar,
  className,
}: TabuleiroProps) {
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

  function aoTeclar(evento: KeyboardEvent, p: Ponto): void {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault();
    aoTocar?.(p);
  }

  const de = ultimaJogada ? posicao(ultimaJogada.de) : null;
  const para = ultimaJogada ? posicao(ultimaJogada.para) : null;

  return (
    <svg
      className={['tabuleiro', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role={aoTocar ? 'group' : 'img'}
      aria-label="Tabuleiro do Adugo"
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
            className={`foco foco--aviso-${Math.min(foco.aviso, 2)}`}
            transform={`translate(${posicao(foco.ponto).x} ${posicao(foco.ponto).y})`}
          >
            <FocoArte x={-TAMANHO_FOCO / 2} y={-TAMANHO_FOCO / 2} width={TAMANHO_FOCO} height={TAMANHO_FOCO} />
          </g>
        )}

        {caes.map((p, i) => {
          if (p === null) return null;
          const { x, y } = posicao(p);
          const Seixo = CACHORROS[i % CACHORROS.length]!;
          const tamanho = TAMANHO_CAO * ESCALAS[i % ESCALAS.length]!;
          return (
            <Peca key={i} x={x} y={y} tamanho={tamanho} selecionada={p === selecionado}>
              <Seixo x={-tamanho / 2} y={-tamanho / 2} width={tamanho} height={tamanho} />
            </Peca>
          );
        })}

        <Peca x={posicao(onca).x} y={posicao(onca).y} tamanho={TAMANHO_ONCA} selecionada={onca === selecionado}>
          <Onca x={-TAMANHO_ONCA / 2} y={-TAMANHO_ONCA / 2} width={TAMANHO_ONCA} height={TAMANHO_ONCA} />
        </Peca>
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
              tabIndex={0}
              aria-label={rotulo(p)}
              onClick={() => aoTocar(p)}
              onKeyDown={(evento) => aoTeclar(evento, p)}
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

interface PecaProps {
  readonly x: number;
  readonly y: number;
  readonly tamanho: number;
  readonly selecionada: boolean;
  readonly children: ReactNode;
}

/** Uma pedra no chão: a sombra é do tabuleiro, para crescer quando a peça é levantada. */
function Peca({ x, y, tamanho, selecionada, children }: PecaProps) {
  const raio = tamanho / 2;
  return (
    <g className={selecionada ? 'peca peca--selecionada' : 'peca'} style={{ translate: `${x}px ${y}px` }}>
      <ellipse className="peca__sombra" rx={raio * 0.92} ry={raio * 0.84} />
      {selecionada && (
        <>
          <circle className="peca__anel-fora" r={raio + 9} />
          <circle className="peca__anel-dentro" r={raio + 6.5} />
        </>
      )}
      <g className="peca__pedra">{children}</g>
    </g>
  );
}
