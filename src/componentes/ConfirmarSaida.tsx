// Pergunta antes de abandonar a partida. É um <dialog> da própria página, e não
// `window.confirm`: navegadores embutidos em outros aplicativos (WhatsApp, Instagram,
// painéis de visualização) e o próprio Chrome, depois de alguns avisos, suprimem a caixa
// nativa e devolvem "cancelar" na hora. O botão de sair ficava sem efeito.

import { useEffect, useId, useRef } from 'react';
import './ConfirmarSaida.css';

export interface ConfirmarSaidaProps {
  readonly aberto: boolean;
  readonly aoSair: () => void;
  /** Fechar com "Continuar jogando", Esc ou clique fora. */
  readonly aoContinuar: () => void;
}

export function ConfirmarSaida({ aberto, aoSair, aoContinuar }: ConfirmarSaidaProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const continuar = useRef<HTMLButtonElement>(null);
  const titulo = useId();
  const texto = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aberto && !d.open) {
      d.showModal();
      // A opção segura recebe o foco: Enter por engano não perde a partida.
      continuar.current?.focus();
    } else if (!aberto && d.open) {
      d.close();
    }
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      className="confirmar-saida painel"
      aria-labelledby={titulo}
      aria-describedby={texto}
      onClose={() => {
        if (dialogo.current?.returnValue === 'sair') aoSair();
        else aoContinuar();
        if (dialogo.current) dialogo.current.returnValue = '';
      }}
      onClick={(evento) => {
        // Clique no fundo escurecido (fora do quadro) vale como continuar.
        if (evento.target === evento.currentTarget) dialogo.current?.close();
      }}
    >
      <form method="dialog" className="confirmar-saida__corpo">
        <h2 id={titulo}>Sair da partida?</h2>
        <p id={texto}>A partida em andamento será perdida.</p>
        <div className="confirmar-saida__botoes">
          <button ref={continuar} type="submit" value="continuar" className="botao">
            Continuar jogando
          </button>
          <button type="submit" value="sair" className="botao botao--secundario">
            Sair
          </button>
        </div>
      </form>
    </dialog>
  );
}
