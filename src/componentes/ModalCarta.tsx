// Carta educativa (docs/MECANICAS.md, seção 7; docs/ESTETICA.md, seção 7).
// Exporta `CartaoCarta` (para uso em lista na tela final ou na prancha) e
// `ModalCarta` (que abre sobre o tabuleiro via <dialog> nativo na top layer).

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentType,
  type FormEvent,
  type RefObject,
  type SVGProps,
} from 'react';
import { IconeBroto, IconeChama, IconePataOnca } from '../arte';
import { TITULO_CARTA, type Carta, type TipoCarta } from '../conteudo';
import './ModalCarta.css';

type SvgIcone = ComponentType<SVGProps<SVGSVGElement>>;

const ICONE_POR_TIPO: Readonly<Record<TipoCarta, SvgIcone>> = {
  queimada: IconeChama,
  cuidado: IconeBroto,
  onca: IconePataOnca,
};

let suportaTransicaoDisplay: boolean | undefined;

function podeTransicionarDisplay(): boolean {
  if (suportaTransicaoDisplay !== undefined) return suportaTransicaoDisplay;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const teste = document.createElement('div');
  teste.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(teste);
  getComputedStyle(teste).display;
  teste.style.display = 'none';
  suportaTransicaoDisplay = getComputedStyle(teste).display === 'block';
  teste.remove();
  return suportaTransicaoDisplay;
}

function suportaSaidaTopLayer(): boolean {
  return Boolean(window.CSS?.supports?.('overlay', 'auto')) && podeTransicionarDisplay();
}

export interface CartaoCartaProps {
  readonly carta: Carta;
  /** ID opcional para o cabeçalho (usado por `aria-labelledby` do `<dialog>`). */
  readonly tituloId?: string;
  /** Se informado, exibe o botão "Continuar" que aciona este callback. */
  readonly aoContinuar?: () => void;
  /** Se `true`, o botão "Continuar" funciona como submit de `<form method="dialog">`. */
  readonly dentroDeDialog?: boolean;
  /** Ref opcional para focar o botão "Continuar" ao abrir o modal. */
  readonly botaoContinuarRef?: RefObject<HTMLButtonElement | null>;
  readonly className?: string;
}

export function CartaoCarta({
  carta,
  tituloId,
  aoContinuar,
  dentroDeDialog = false,
  botaoContinuarRef,
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
          <button
            ref={botaoContinuarRef}
            type="submit"
            value="continuar"
            className="botao"
            autoFocus
          >
            Continuar
          </button>
        ) : (
          aoContinuar && (
            <button ref={botaoContinuarRef} type="button" className="botao" onClick={aoContinuar}>
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
  const botaoRef = useRef<HTMLButtonElement>(null);
  const fechandoRef = useRef(false);
  const tituloId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (carta) {
      fechandoRef.current = false;
      dialog.removeAttribute('data-closing');
      if (!dialog.open) {
        dialog.showModal();
      }
      // Garante foco imediato no botão "Continuar" em vez do link da fonte que vem antes no DOM.
      botaoRef.current?.focus();
    } else if (dialog.open) {
      dialog.removeAttribute('data-closing');
      dialog.close();
    }
  }, [carta]);

  const fecharComAnimacao = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || fechandoRef.current) return;

    if (!suportaSaidaTopLayer()) {
      fechandoRef.current = true;
      dialog.setAttribute('data-closing', '');
      const animacoes = dialog.getAnimations({ subtree: true });
      if (animacoes.length > 0) {
        await Promise.race([
          Promise.allSettled(animacoes.map((a) => a.finished)),
          new Promise<void>((resolve) => setTimeout(resolve, 600)),
        ]);
      }
      if (!dialog.hasAttribute('data-closing')) return;
      dialog.removeAttribute('data-closing');
      fechandoRef.current = false;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, []);

  function aoEnviarFormulario(evento: FormEvent<HTMLFormElement>): void {
    if (!suportaSaidaTopLayer()) {
      evento.preventDefault();
      void fecharComAnimacao();
    }
  }

  function lidarComCancel(evento: React.SyntheticEvent<HTMLDialogElement>): void {
    if (!suportaSaidaTopLayer()) {
      evento.preventDefault();
      void fecharComAnimacao();
    }
  }

  function lidarComClose(): void {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
      dialog.removeAttribute('data-closing');
    }
    fechandoRef.current = false;
    if (carta) {
      aoFechar();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-carta"
      aria-labelledby={tituloId}
      onCancel={lidarComCancel}
      onClose={lidarComClose}
    >
      {carta && (
        <form method="dialog" onSubmit={aoEnviarFormulario}>
          <CartaoCarta
            carta={carta}
            tituloId={tituloId}
            dentroDeDialog
            botaoContinuarRef={botaoRef}
          />
        </form>
      )}
    </dialog>
  );
}
