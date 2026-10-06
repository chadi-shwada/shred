/**
 * Niveau de risque indicatif d'une fuite, tiré des types de données exposés
 * (libellés HIBP). Règle publique, affichée à côté du badge : ce n'est pas une
 * évaluation de la fuite, seulement un repère.
 */

export type RiskLevel = 'eleve' | 'moyen' | 'faible';

/** Données qui permettent une fraude directe ou touchent à l'intime. */
const HIGH = new Set([
  'Passwords',
  'Historical passwords',
  'Password hints',
  'Auth tokens',
  'Security questions and answers',
  'PINs',
  'Credit cards',
  'Partial credit card data',
  'Credit card CVV',
  'Bank account numbers',
  'Financial transactions',
  'Social security numbers',
  'Passport numbers',
  'Taxation records',
  'Biometric data',
  'Personal health data',
  'Health insurance information',
  'Sexual orientations',
  'Sexual fetishes',
]);

/** Données qui rendent l'hameçonnage ou l'usurpation plus crédibles. */
const MEDIUM = new Set(['Phone numbers', 'Physical addresses', 'Dates of birth', 'Places of birth']);

export const RISK_LABELS: Record<RiskLevel, string> = {
  eleve: 'Risque élevé',
  moyen: 'Risque moyen',
  faible: 'Risque faible',
};

export const RISK_RULE =
  'Repère indicatif : élevé si des mots de passe, données bancaires, pièces d’identité ou données de santé ont fuité ; moyen si un téléphone, une adresse ou une date de naissance ; faible sinon.';

export function breachRisk(dataClasses: readonly string[]): RiskLevel {
  if (dataClasses.some((dc) => HIGH.has(dc))) return 'eleve';
  if (dataClasses.some((dc) => MEDIUM.has(dc))) return 'moyen';
  return 'faible';
}
