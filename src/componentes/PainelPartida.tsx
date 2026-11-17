// Peças do painel da partida (docs/ESTETICA.md, seção 6): de quem é a vez, os dois
// placares e a linha da rodada. A tela da partida decide onde cada uma fica.

import type { ReactNode } from 'react';
import { CACHORROS, IconePataCachorro, IconePataOnca, Queimado } from '../arte';
import type { Estado } from '../motor';
import './PainelPartida.css';

export interface IndicadorDeVezProps {
  readonly estado: Estado;
  readonly texto: string;
}

/** Faixa com a pata de quem joga agora. Troca com um deslize curto. */
export function IndicadorDeVez({ estado, texto }: IndicadorDeVezProps) {
  const Pata = estado.vez === 'onca' ? IconePataOnca : IconePataCachorro;
  return (
    <div className={`vez vez--${estado.vez}`}>
      {/* A chave faz o conteúdo entrar de novo a cada troca de vez. */}
      <span key={texto} className="vez__conteudo">
        <Pata className="vez__pata" aria-hidden="true" />
        <span className="vez__texto">{texto}</span>
      </span>
    </div>
  );
}

interface PlacarProps {
  readonly titulo: string;
  readonly cheios: number;
  readonly total: number;
  readonly className?: string;
  readonly vaga: (indice: number, cheia: boolean) => ReactNode;
}

function Placar({ titulo, cheios, total, className, vaga }: PlacarProps) {
  return (
    <div className={['placar', className].filter(Boolean).join(' ')} role="img" aria-label={`${titulo}: ${cheios} de ${total}`}>
      <span className="placar__titulo" aria-hidden="true">
        {titulo}
      </span>
      <span className="placar__fila" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="placar__vaga">
            {vaga(i, i < cheios)}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Cinco covinhas: cada cachorro capturado vira uma pedrinha dentro de uma. */
export function PlacarCapturas({ estado, className }: { estado: Estado; className?: string }) {
  return (
    <Placar
      titulo="Capturas"
      cheios={estado.capturas}
      total={estado.config.capturasParaVencer}
      className={className}
      vaga={(i, cheia) => {
        if (!cheia) return <span className="placar__covinha" />;
        const Seixo = CACHORROS[i % CACHORROS.length]!;
        return <Seixo className="placar__pedra" />;
      }}
    />
  );
}

/** Cinco discos de chão: cada ponto queimado transforma um deles em carvão. */
export function PlacarTerritorio({ estado, className }: { estado: Estado; className?: string }) {
  return (
    <Placar
      titulo="Território"
      cheios={estado.queimados.length}
      total={estado.config.fogo.limiteQueimados}
      className={className}
      vaga={(_, cheia) => (cheia ? <Queimado className="placar__queimado" /> : <span className="placar__chao" />)}
    />
  );
}

export interface InfoRodadaProps {
  readonly rodada: number;
  /** Linha sobre o fogo ("Próximo foco em 3 rodadas"), ou `null` no modo clássico. */
  readonly fogo: string | null;
  readonly className?: string;
}

export function InfoRodada({ rodada, fogo, className }: InfoRodadaProps) {
  return (
    <div className={['rodada', className].filter(Boolean).join(' ')}>
      <span className="rodada__numero">Rodada {rodada}</span>
      {fogo && <span className="rodada__fogo">{fogo}</span>}
    </div>
  );
}
