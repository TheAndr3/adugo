import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { IconeVoltar } from './arte';
import { CARTAS } from './conteudo';
import { criarEstado, ponto as P, type Estado, type Modo } from './motor';
import { TelaFim } from './telas/TelaFim';
import { TelaInicio } from './telas/TelaInicio';
import { TelaSobre } from './telas/TelaSobre';
import './telas/Telas.css';

const Prancha = lazy(() => import('./telas/Prancha').then((m) => ({ default: m.Prancha })));

function assinarHash(avisar: () => void): () => void {
  window.addEventListener('hashchange', avisar);
  return () => window.removeEventListener('hashchange', avisar);
}

function navegarHash(novoHash: string): void {
  window.location.hash = novoHash;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const ESTADO_EXEMPLO_FIM: Estado = {
  ...criarEstado({
    modo: 'territorio',
    rodada: 38,
    capturas: 3,
    queimados: [P(0, 0), P(0, 4), P(4, 0), P(4, 4), P(2, 0)],
  }),
  apagados: { onca: 2, caes: 4 },
  resultado: { tipo: 'territorio' },
};

// Navegação principal entre as telas (docs/ESTETICA.md, seção 10).
// A prancha de arte continua acessível em /#prancha.
export function App() {
  const hash = useSyncExternalStore(assinarHash, () => window.location.hash);
  const [modoPartida, setModoPartida] = useState<Modo>('territorio');
  const [estadoFinal] = useState<Estado>(ESTADO_EXEMPLO_FIM);

  useEffect(() => {
    const sufixo = 'Adugo: Território da Onça';
    if (hash === '#prancha') document.title = `Prancha de arte | ${sufixo}`;
    else if (hash === '#sobre') document.title = `Sobre o jogo e o povo Bororo | ${sufixo}`;
    else if (hash === '#como-jogar') document.title = `Como se joga | ${sufixo}`;
    else if (hash === '#fim') document.title = `Fim da partida | ${sufixo}`;
    else if (hash === '#partida') document.title = `Partida | ${sufixo}`;
    else document.title = sufixo;
  }, [hash]);

  if (hash === '#prancha') {
    return (
      <Suspense fallback={null}>
        <Prancha />
      </Suspense>
    );
  }

  if (hash === '#sobre') {
    return <TelaSobre aoVoltar={() => navegarHash('')} />;
  }

  if (hash === '#fim') {
    return (
      <TelaFim
        estado={estadoFinal}
        cartasDaPartida={CARTAS.slice(0, 3)}
        aoJogarDeNovo={() => navegarHash('#partida')}
        aoVoltarInicio={() => navegarHash('')}
      />
    );
  }

  if (hash === '#como-jogar') {
    return (
      <main className="tela">
        <header className="tela__topo">
          <h1>Como se joga</h1>
          <button type="button" className="botao botao--secundario" onClick={() => navegarHash('')}>
            <IconeVoltar aria-hidden="true" />
            Voltar ao início
          </button>
        </header>
        <section className="painel tela__secao">
          <p>A tela interativa com os 4 mini tabuleiros entra na Issue #7.</p>
        </section>
      </main>
    );
  }

  if (hash === '#partida') {
    return (
      <main className="tela">
        <header className="tela__topo">
          <h1>Partida ({modoPartida === 'territorio' ? 'Território da Onça' : 'Adugo clássico'})</h1>
          <button type="button" className="botao botao--secundario" onClick={() => navegarHash('')}>
            <IconeVoltar aria-hidden="true" />
            Voltar ao início
          </button>
        </header>
        <section className="painel tela__secao">
          <p>A interface da partida entra na Issue #4.</p>
          <div>
            <button type="button" className="botao botao--secundario" onClick={() => navegarHash('#fim')}>
              Ver tela de fim de partida
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <TelaInicio
      aoIniciarPartida={(modo) => {
        setModoPartida(modo);
        navegarHash('#partida');
      }}
      aoAbrirComoJogar={() => navegarHash('#como-jogar')}
      aoAbrirSobre={() => navegarHash('#sobre')}
    />
  );
}
