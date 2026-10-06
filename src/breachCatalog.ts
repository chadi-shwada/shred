import { EMPTY_CATALOG, parseCatalog, type BreachCatalog } from './lib/breaches';

/*
 * Le catalogue est généré au build (scripts/fetch-breaches.mjs) et n'est pas
 * versionné. import.meta.glob renvoie un objet vide si le fichier manque :
 * le site fonctionne alors sans catalogue. Le chargement est différé pour ne
 * pas alourdir les autres pages.
 */
const modules = import.meta.glob<unknown>('./data/breaches.generated.json', { import: 'default' });

let cache: Promise<BreachCatalog> | null = null;
let loaded: BreachCatalog | null = null;

export function loadBreachCatalog(): Promise<BreachCatalog> {
  if (!cache) {
    const load = modules['./data/breaches.generated.json'];
    cache = (load ? load().then(parseCatalog, () => EMPTY_CATALOG) : Promise.resolve(EMPTY_CATALOG)).then((c) => {
      loaded = c;
      return c;
    });
  }
  return cache;
}

/**
 * Catalogue déjà chargé, sans attendre ; null sinon. Permet aux pages de fuite de s'afficher d'emblée
 * quand le catalogue a été chargé avant le premier rendu (main.tsx, pré-rendu au build).
 */
export function loadedBreachCatalog(): BreachCatalog | null {
  return loaded;
}
