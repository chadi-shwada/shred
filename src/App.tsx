import { useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { About } from './pages/About';
import { BreachPage } from './pages/BreachPage';
import { Generator } from './pages/Generator';
import { Home } from './pages/Home';
import { LegalNotice } from './pages/LegalNotice';
import { NotFound } from './pages/NotFound';
import { Resources } from './pages/Resources';
import { Stats } from './pages/Stats';
import { Tracker } from './pages/Tracker';
import { Verify } from './pages/Verify';
import { WhatToDo } from './pages/WhatToDo';
import { BREACH_PATH_PREFIX } from './lib/breachPages';
import { revealOnScroll } from './reveal';
import { pageMeta } from './seo';
import { anchorId, interceptLinks, upgradeLegacyUrl, useRoute, type Route } from './router';

function Page({ route }: { route: Route }) {
  switch (route.path) {
    case '/':
      return <Home />;
    case '/verifier':
      return <Verify />;
    case '/que-faire':
      return <WhatToDo />;
    case '/lettre':
      // La clé réinitialise le formulaire quand on arrive avec d'autres paramètres (relance depuis le suivi).
      return <Generator key={route.query.toString()} route={route} />;
    case '/suivi':
      return <Tracker />;
    case '/ressources':
      return <Resources />;
    case '/chiffres':
      return <Stats />;
    case '/a-propos':
      return <About />;
    case '/mentions-legales':
      return <LegalNotice />;
    default:
      if (route.path.startsWith(BREACH_PATH_PREFIX)) {
        return <BreachPage key={route.path} slug={route.path.slice(BREACH_PATH_PREFIX.length)} />;
      }
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
    // Les pages de fuite posent leur titre une fois le catalogue chargé.
    document.title = route.path.startsWith(BREACH_PATH_PREFIX)
      ? 'Fuite de données · ShredRGPD'
      : pageMeta(route.path).title;
    if (first.current) {
      first.current = false;
      return;
    }
    // Changement de page : on remonte en haut (ou à l'ancre demandée) et on place le focus sur le contenu.
    const id = anchorId(window.location.hash);
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    document.getElementById('contenu')?.focus({ preventScroll: true });
  }, [route.path]);

  // Après le rendu de chaque page : apparition des blocs au défilement.
  useEffect(() => revealOnScroll(), [route.path]);

  return (
    <Layout path={route.path}>
      <Page route={route} />
    </Layout>
  );
}
