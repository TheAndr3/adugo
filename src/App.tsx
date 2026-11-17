import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { criarBaralho, iniciarPartidaNoBaralho, type BaralhoSessao, type Carta } from './conteudo';
import type { Estado, Modo } from './motor';
import { TelaComoJogar } from './telas/TelaComoJogar';
import { TelaFim } from './telas/TelaFim';
import { TelaInicio } from './telas/TelaInicio';
import { TelaPartida } from './telas/TelaPartida';
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

interface Partida {
  /** Muda a cada partida nova, para a tela recomeçar do zero. */
  readonly numero: number;
  readonly modo: Modo;
  /** A partida acabou; voltar para `#partida` pelo navegador não pode recomeçá-la. */
  readonly terminada: boolean;
}

interface Final {
  readonly estado: Estado;
  readonly cartas: readonly Carta[];
}

// Navegação principal entre as telas (docs/ESTETICA.md, seção 10).
// A prancha de arte continua acessível em /#prancha.
export function App() {
  const hash = useSyncExternalStore(assinarHash, () => window.location.hash);
  // O baralho vale para a sessão inteira: a segunda partida mostra cartas que ainda não saíram.
  const [baralho, setBaralho] = useState<BaralhoSessao>(() => criarBaralho(Date.now() >>> 0));
  const [partida, setPartida] = useState<Partida>({ numero: 0, modo: 'territorio', terminada: false });
  const [final, setFinal] = useState<Final | null>(null);

  function comecarPartida(modo: Modo): void {
    setBaralho((atual) => iniciarPartidaNoBaralho(atual));
    setPartida((atual) => ({ numero: atual.numero + 1, modo, terminada: false }));
    setFinal(null);
    navegarHash('#partida');
  }

  useEffect(() => {
    const sufixo = 'Adugo: Território da Onça';
    if (hash === '#prancha') document.title = `Prancha de arte | ${sufixo}`;
    else if (hash === '#sobre') document.title = `Sobre o jogo e o povo Bororo | ${sufixo}`;
    else if (hash === '#como-jogar') document.title = `Como se joga | ${sufixo}`;
    else if (hash === '#fim') document.title = `Fim da partida | ${sufixo}`;
    else if (hash === '#partida') document.title = `Partida | ${sufixo}`;
    else document.title = sufixo;
  }, [hash]);

  // A tela de fim só existe depois de uma partida. Quem chega nela sem ter jogado
  // (recarregou a página, colou o endereço) volta para o início.
  const semFinal = hash === '#fim' && final === null;
  // Pelo voltar do navegador a partir da tela de fim, a partida encerrada não recomeça:
  // a pessoa vai para o início. `replace` para o voltar seguinte não cair aqui de novo.
  const partidaEncerrada = hash === '#partida' && partida.terminada;
  const irParaInicio = semFinal || partidaEncerrada;
  useEffect(() => {
    if (irParaInicio) window.location.replace('#');
  }, [irParaInicio]);

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

  if (hash === '#fim' && final) {
    return (
      <TelaFim
        estado={final.estado}
        cartasDaPartida={final.cartas}
        aoJogarDeNovo={() => comecarPartida(final.estado.modo)}
        aoVoltarInicio={() => navegarHash('')}
      />
    );
  }

  if (hash === '#como-jogar') {
    return <TelaComoJogar aoVoltar={() => navegarHash('')} aoIniciarPartida={comecarPartida} />;
  }

  if (hash === '#partida' && !partida.terminada) {
    return (
      <TelaPartida
        key={partida.numero}
        modo={partida.modo}
        baralhoInicial={baralho}
        aoTerminar={(estado, baralhoFinal) => {
          setBaralho(baralhoFinal);
          setPartida((atual) => ({ ...atual, terminada: true }));
          setFinal({ estado, cartas: baralhoFinal.cartasDaPartida });
          navegarHash('#fim');
        }}
        aoSair={() => navegarHash('')}
      />
    );
  }

  return (
    <TelaInicio
      aoIniciarPartida={comecarPartida}
      aoAbrirComoJogar={() => navegarHash('#como-jogar')}
      aoAbrirSobre={() => navegarHash('#sobre')}
    />
  );
}
