import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadBreachCatalog } from './breachCatalog';
import { BREACH_PATH_PREFIX } from './lib/breachPages';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

// Le HTML contient déjà la page, pré-rendue au build (scripts/prerender.mjs) ; l'application la
// remplace. Sur une page de fuite, le catalogue est chargé avant, pour ne pas afficher « Chargement… »
// à la place du contenu déjà visible.
const ready = window.location.pathname.startsWith(BREACH_PATH_PREFIX) ? loadBreachCatalog() : Promise.resolve();

void ready.then(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
