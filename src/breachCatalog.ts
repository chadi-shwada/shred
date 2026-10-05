import { EMPTY_CATALOG, parseCatalog, type BreachCatalog } from './lib/breaches';

/*
 * Le catalogue est généré au build (scripts/fetch-breaches.mjs) et n'est pas
 * versionné. import.meta.glob renvoie un objet vide si le fichier manque :
 * le site fonctionne alors sans catalogue. Le chargement est différé pour ne
 * pas alourdir les autres pages.
 */
const modules = import.meta.glob<unknown>('./data/breaches.generated.json', { import: 'default' });

let cache: Promise<BreachCatalog> | null = null;

export function loadBreachCatalog(): Promise<BreachCatalog> {
  if (!cache) {
    const load = modules['./data/breaches.generated.json'];
    cache = load ? load().then(parseCatalog, () => EMPTY_CATALOG) : Promise.resolve(EMPTY_CATALOG);
  }
  return cache;
}
