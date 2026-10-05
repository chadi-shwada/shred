import { useSyncExternalStore } from 'react';

/**
 * Routage par fragment (#/lettre) : marche sur GitHub Pages sans configuration
 * serveur et ne transmet jamais la route au serveur.
 */

export type RoutePath = '/' | '/verifier' | '/lettre' | '/suivi' | '/ressources' | '/a-propos';

export interface Route {
  path: string;
  query: URLSearchParams;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function snapshot(): string {
  return window.location.hash;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path = '/', search = ''] = raw.split('?');
  return { path: path.startsWith('/') ? path : `/${path}`, query: new URLSearchParams(search) };
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, snapshot, () => '');
  return parseHash(hash);
}

export function href(path: RoutePath, query?: Record<string, string>): string {
  const search = query ? new URLSearchParams(query).toString() : '';
  return `#${path}${search ? `?${search}` : ''}`;
}
