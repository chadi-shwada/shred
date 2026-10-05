import { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { About } from './pages/About';
import { Generator } from './pages/Generator';
import { Home } from './pages/Home';
import { LegalNotice } from './pages/LegalNotice';
import { NotFound } from './pages/NotFound';
import { Resources } from './pages/Resources';
import { Tracker } from './pages/Tracker';
import { Verify } from './pages/Verify';
import { pageMeta } from './seo';
import { interceptLinks, upgradeLegacyUrl, useRoute, type Route } from './router';

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
    case '/mentions-legales':
      return <LegalNotice />;
    default:
      return <NotFound />;
  }
}

export function App() {
  const route = useRoute();
  const first = useRef(true);

  useEffect(() => {
    upgradeLegacyUrl();
    window.addEventListener('hashchange', upgradeLegacyUrl);
    document.addEventListener('click', interceptLinks);
    return () => {
      window.removeEventListener('hashchange', upgradeLegacyUrl);
      document.removeEventListener('click', interceptLinks);
    };
  }, []);

  useEffect(() => {
    document.title = pageMeta(route.path).title;
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
