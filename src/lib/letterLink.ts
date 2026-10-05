/**
 * Paramètres d'adresse entre la page de vérification et le générateur :
 * une fuite choisie devient une lettre pré-remplie (contexte « violation »).
 */

import { mapDataClasses, type Breach } from './breaches';
import { DATA_CATEGORIES, type DataCategory, type InitialKind } from './letters';

export function breachLetterQuery(breach: Breach, kind: InitialKind): Record<string, string> {
  const { categories, others } = mapDataClasses(breach.dataClasses);
  const query: Record<string, string> = {
    type: kind,
    contexte: 'violation',
    site: breach.title,
    'date-fuite': breach.date,
  };
  // Le nom HIBP n'apporte rien s'il répète le titre.
  if (breach.name.toLowerCase() !== breach.title.toLowerCase()) query.fuite = breach.name;
  if (categories.length > 0) query.donnees = categories.join(',');
  if (others.length > 0) query.autres = others.join(', ');
  return query;
}

/** Lit la liste « email,motDePasse » en ignorant les valeurs inconnues. */
export function parseCategories(value: string | null): DataCategory[] {
  if (!value) return [];
  const valid = Object.keys(DATA_CATEGORIES);
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v, i, all): v is DataCategory => valid.includes(v) && all.indexOf(v) === i);
}
