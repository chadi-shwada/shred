/**
 * Pré-rendu des pages au build (scripts/prerender.mjs) : le contenu de chaque page est écrit dans
 * son fichier HTML, pour les moteurs de recherche qui n'exécutent pas (ou mal) le JavaScript.
 * Dans le navigateur, main.tsx remplace ce contenu par l'application.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { loadBreachCatalog } from './breachCatalog';
import { setServerLocation } from './router';

export async function renderPage(path: string): Promise<string> {
  await loadBreachCatalog();
  setServerLocation(path);
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
