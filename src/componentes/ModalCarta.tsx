// Carta educativa (docs/MECANICAS.md, seção 7; docs/ESTETICA.md, seção 7).
// Exporta `CartaoCarta` (para uso em lista na tela final ou na prancha) e
// `ModalCarta` (que abre sobre o tabuleiro via <dialog> nativo na top layer).

import { useEffect, useId, useRef, type ComponentType, type SVGProps } from 'react';
import { IconeBroto, IconeChama, IconePataOnca } from '../arte';
import { TITULO_CARTA, type Carta, type TipoCarta } from '../conteudo';
import './ModalCarta.css';

type SvgIcone = ComponentType<SVGProps<SVGSVGElement>>;

const ICONE_POR_TIPO: Readonly<Record<TipoCarta, SvgIcone>> = {
  queimada: IconeChama,
  cuidado: IconeBroto,
  onca: IconePataOnca,
};

export interface CartaoCartaProps {
  readonly carta: Carta;
  /** ID opcional para o cabeçalho (usado por `aria-labelledby` do `<dialog>`). */
  readonly tituloId?: string;
  /** Se informado, exibe o botão "Continuar" que aciona este callback. */
  readonly aoContinuar?: () => void;
  /** Se `true`, o botão "Continuar" funciona como submit de `<form method="dialog">`. */
  readonly dentroDeDialog?: boolean;
  readonly className?: string;
}

export function CartaoCarta({
  carta,
  tituloId,
  aoContinuar,
  dentroDeDialog = false,
  className,
}: CartaoCartaProps) {
  const Icone = ICONE_POR_TIPO[carta.tipo];
  const titulo = TITULO_CARTA[carta.tipo];
  const { fonte } = carta;

  return (
    <article className={['carta', `carta--${carta.tipo}`, className].filter(Boolean).join(' ')}>
      <header className="carta__faixa">
        <Icone aria-hidden="true" />
        <h2 id={tituloId} style={{ fontSize: 'inherit', margin: 0 }}>
          {titulo}
        </h2>
      </header>
      <div className="carta__corpo">
        <p className="carta__texto">{carta.texto}</p>
        <p className="carta__fonte">
          Fonte:{' '}
          <a
            className="carta__fonte-link"
            href={fonte.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {fonte.titulo}
          </a>{' '}
          — {fonte.autor} ({fonte.ano})
        </p>
        {dentroDeDialog ? (
          <form method="dialog">
            <button type="submit" value="continuar" className="botao" autoFocus>
              Continuar
            </button>
          </form>
        ) : (
          aoContinuar && (
            <button type="button" className="botao" onClick={aoContinuar}>
              Continuar
            </button>
          )
        )}
      </div>
    </article>
  );
}

export interface ModalCartaProps {
  /** Carta a exibir. Quando `null`, o modal permanece fechado. */
  readonly carta: Carta | null;
  /** Chamado quando a pessoa fecha a carta (botão "Continuar" ou tecla `Esc`). */
  readonly aoFechar: () => void;
}

export function ModalCarta({ carta, aoFechar }: ModalCartaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (carta) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [carta]);

  function lidarComClose(): void {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
    }
    if (carta) {
      aoFechar();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-carta"
      aria-labelledby={tituloId}
      onClose={lidarComClose}
    >
      {carta && <CartaoCarta carta={carta} tituloId={tituloId} dentroDeDialog />}
    </dialog>
  );
}
