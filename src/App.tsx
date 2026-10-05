import { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { About } from './pages/About';
import { Generator } from './pages/Generator';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Resources } from './pages/Resources';
import { Tracker } from './pages/Tracker';
import { Verify } from './pages/Verify';
import { useRoute, type Route } from './router';

const TITLES: Record<string, string> = {
  '/': "Shred · Demande l'effacement de tes données",
  '/verifier': 'Vérifier mes fuites · Shred',
  '/lettre': 'Écrire une lettre · Shred',
  '/suivi': 'Suivi · Shred',
  '/ressources': 'Ressources · Shred',
  '/a-propos': 'À propos · Shred',
};

function Page({ route }: { route: Route }) {
  switch (route.path) {
    case '/':
      return <Home />;
    case '/verifier':
      return <Verify />;
    case '/lettre':
      // La clé réinitialise le formulaire quand on arrive avec d'autres paramètres (relance depuis le suivi).
      return <Generator key={route.query.toString()} route={route} />;
    case '/suivi':
      return <Tracker />;
    case '/ressources':
      return <Resources />;
    case '/a-propos':
      return <About />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const route = useRoute();
  const first = useRef(true);

  useEffect(() => {
    document.title = TITLES[route.path] ?? 'Page introuvable · Shred';
    if (first.current) {
      first.current = false;
      return;
    }
    // Changement de page : on remonte en haut et on place le focus sur le contenu.
    window.scrollTo(0, 0);
    document.getElementById('contenu')?.focus({ preventScroll: true });
  }, [route.path]);

  return (
    <Layout path={route.path}>
      <Page route={route} />
    </Layout>
  );
}
