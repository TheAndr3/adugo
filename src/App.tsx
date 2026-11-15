import { lazy, Suspense, useSyncExternalStore } from 'react';

const Prancha = lazy(() => import('./telas/Prancha').then((m) => ({ default: m.Prancha })));

function assinarHash(avisar: () => void): () => void {
  window.addEventListener('hashchange', avisar);
  return () => window.removeEventListener('hashchange', avisar);
}

// Tela provisória. A interface da partida entra aqui (docs/ESTETICA.md, seção 10).
// A prancha de arte fica em /#prancha.
export function App() {
  const hash = useSyncExternalStore(assinarHash, () => window.location.hash);

  if (hash === '#prancha') {
    return (
      <Suspense fallback={null}>
        <Prancha />
      </Suspense>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Adugo: Território da Onça</h1>
      <p>Em construção.</p>
      <p>
        <a href="#prancha">Ver a prancha de arte</a>
      </p>
    </main>
  );
}
