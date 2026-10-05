/**
 * Génération des lettres RGPD.
 *
 * Les modèles sont indicatifs et ne constituent pas un conseil juridique.
 * Ils s'inspirent de la structure du modèle de la CNIL
 * (cnil.fr/modele/courrier/supprimer-des-donnees-personnelles) :
 * article 17.1 pour l'effacement, article 12.3 pour le délai d'un mois,
 * article 19 pour la notification aux destinataires.
 *
 * Toute modification d'une lettre cite l'article concerné et met à jour
 * letters.test.ts.
 */

import { formatLongFr, gdprDeadlines, type IsoDate } from './dates';

export type LetterKind = 'effacement' | 'acces' | 'relance';
export type InitialKind = Exclude<LetterKind, 'relance'>;

export const DATA_CATEGORIES = {
  nomPrenom: 'nom et prénom',
  email: 'adresse e-mail',
  motDePasse: 'mot de passe ou son empreinte (hash)',
  telephone: 'numéro de téléphone',
  adresse: 'adresse postale',
  dateNaissance: 'date de naissance',
  bancaire: 'coordonnées bancaires',
  identifiant: 'identifiant ou pseudonyme',
  ip: 'adresse IP',
} as const;

export type DataCategory = keyof typeof DATA_CATEGORIES;

export interface LetterInput {
  kind: LetterKind;
  /** Nom de la personne qui signe. Obligatoire. */
  fullName: string;
  /** E-mail concerné par la fuite ou de contact. Facultatif. */
  email?: string;
  /** Adresse postale pour la réponse. Facultative. */
  postalAddress?: string;
  /** Nom du site ou du responsable de traitement. Obligatoire. */
  siteName: string;
  /** Pages où les données apparaissent. */
  urls?: string[];
  dataCategories?: DataCategory[];
  /** Autres données, en texte libre. */
  otherData?: string;
  /** Date de la lettre. */
  date: IsoDate;
  /** Relance seulement : date de la première demande. */
  previousRequestDate?: IsoDate;
  /** Relance seulement : nature de la première demande. */
  previousKind?: InitialKind;
}

export interface Letter {
  subject: string;
  body: string;
  /** Articles du RGPD cités dans la lettre, dans l'ordre d'apparition. */
  articles: string[];
}

const SALUTATION = 'Madame, Monsieur,';
const CLOSING =
  "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";
const RGPD = 'règlement (UE) 2016/679 (RGPD)';

export class LetterInputError extends Error {}

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function dataList(input: LetterInput): string[] {
  const items: string[] = (input.dataCategories ?? []).map((key) => DATA_CATEGORIES[key]);
  const other = clean(input.otherData);
  if (other) items.push(other);
  return items;
}

function urlList(input: LetterInput): string[] {
  return (input.urls ?? []).map((url) => url.trim()).filter(Boolean);
}

function locationParagraph(input: LetterInput, intro: string): string | null {
  const urls = urlList(input);
  const data = dataList(input);
  const parts: string[] = [];
  if (urls.length > 0) parts.push(`${intro}\n${bulletList(urls)}`);
  if (data.length > 0) parts.push(`Les données concernées sont :\n${bulletList(data)}`);
  return parts.length > 0 ? parts.join('\n\n') : null;
}

function identificationParagraph(input: LetterInput): string | null {
  const email = clean(input.email);
  if (!email) return null;
  return `Pour vous permettre de retrouver ces données, l'adresse e-mail concernée est : ${email}.`;
}

function signature(input: LetterInput): string {
  const lines = [clean(input.fullName)];
  const email = clean(input.email);
  const address = clean(input.postalAddress);
  if (address) lines.push(address);
  if (email) lines.push(email);
  lines.push('', `Le ${formatLongFr(input.date)}`);
  return lines.join('\n');
}

function assemble(paragraphs: (string | null)[], input: LetterInput): string {
  return [SALUTATION, ...paragraphs.filter((p): p is string => p !== null), CLOSING, signature(input)].join(
    '\n\n',
  );
}

function effacement(input: LetterInput): Letter {
  const site = clean(input.siteName);
  const body = assemble(
    [
      `Le site ${site} publie ou rend accessibles des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données. Je n'ai jamais consenti à cette diffusion.`,
      locationParagraph(input, 'Elles apparaissent notamment aux adresses suivantes :'),
      identificationParagraph(input),
      `En application de l'article 17.1 du ${RGPD}, et notamment de son point d) (données ayant fait l'objet d'un traitement illicite), je vous demande d'effacer ces données dans les meilleurs délais.`,
      "Ces données ayant été rendues publiques, je vous demande, conformément à l'article 17.2 du RGPD, de prendre les mesures raisonnables pour informer les autres responsables de traitement qui les reproduisent de ma demande d'effacement de tout lien vers ces données et de toute copie de celles-ci.",
      "Conformément à l'article 19 du RGPD, je vous demande également de notifier cet effacement à chaque destinataire auquel ces données ont été communiquées.",
      "L'article 12.3 du RGPD vous impose de me répondre dans les meilleurs délais et au plus tard dans un délai d'un mois à compter de la réception de cette demande. Cette démarche est gratuite (article 12.5 du RGPD).",
      "À défaut de réponse satisfaisante dans ce délai, je me réserve la possibilité d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD.",
    ],
    input,
  );
  return {
    subject: "Demande d'effacement de données personnelles (article 17 du RGPD)",
    body,
    articles: ['17.1', '17.2', '19', '12.3', '12.5', '77'],
  };
}

function acces(input: LetterInput): Letter {
  const site = clean(input.siteName);
  const body = assemble(
    [
      `J'ai des raisons de penser que le site ${site} traite des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données.`,
      locationParagraph(input, 'Elles semblent apparaître aux adresses suivantes :'),
      identificationParagraph(input),
      `En application de l'article 15 du ${RGPD}, je vous demande de me confirmer si vous traitez des données me concernant et, si c'est le cas, de m'en communiquer une copie (article 15.3), ainsi que les informations suivantes :\n${bulletList(
        [
          'les finalités du traitement ;',
          'les catégories de données concernées ;',
          'les destinataires auxquels ces données ont été ou seront communiquées ;',
          'la durée de conservation envisagée ;',
          "toute information disponible sur la source de ces données, puisqu'elles n'ont pas été collectées auprès de moi (article 15.1 g).",
        ],
      )}`,
      "L'article 12.3 du RGPD vous impose de me répondre dans les meilleurs délais et au plus tard dans un délai d'un mois à compter de la réception de cette demande. Cette démarche est gratuite (article 12.5 du RGPD).",
      "À défaut de réponse satisfaisante dans ce délai, je me réserve la possibilité d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD.",
    ],
    input,
  );
  return {
    subject: "Demande d'accès à mes données personnelles (article 15 du RGPD)",
    body,
    articles: ['15', '15.3', '15.1 g', '12.3', '12.5', '77'],
  };
}

const PREVIOUS_LABEL: Record<InitialKind, { noun: string; article: string }> = {
  effacement: { noun: "demande d'effacement de mes données personnelles", article: '17' },
  acces: { noun: "demande d'accès à mes données personnelles", article: '15' },
};

function relance(input: LetterInput): Letter {
  const previousDate = input.previousRequestDate;
  const previousKind = input.previousKind;
  if (!previousDate || !previousKind) {
    throw new LetterInputError('Une relance demande la date et la nature de la première demande.');
  }
  const site = clean(input.siteName);
  const previous = PREVIOUS_LABEL[previousKind];
  const deadline = gdprDeadlines(previousDate).standard;
  const body = assemble(
    [
      `Le ${formatLongFr(previousDate)}, je vous ai adressé une ${previous.noun}, fondée sur l'article ${previous.article} du ${RGPD}, au sujet de données me concernant diffusées sur le site ${site}.`,
      locationParagraph(input, 'Pour rappel, ces données apparaissent aux adresses suivantes :'),
      `L'article 12.3 du RGPD vous imposait d'y répondre dans un délai d'un mois à compter de sa réception, soit au plus tard vers le ${formatLongFr(deadline)} pour une réception le jour de l'envoi. Je n'ai pas reçu de réponse satisfaisante à ce jour.`,
      "Si vous estimez ne pas devoir donner suite à ma demande, l'article 12.4 du RGPD vous oblige à m'en informer et à m'en indiquer les motifs.",
      'Je vous demande donc de traiter ma demande sans plus attendre.',
      "Sans réponse de votre part, j'introduirai une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD. Je conserve une copie de mes échanges avec vous.",
    ],
    input,
  );
  return {
    subject: `Relance : ${previous.noun} (article ${previous.article} du RGPD)`,
    body,
    articles: [previous.article, '12.3', '12.4', '77'],
  };
}

export function generateLetter(input: LetterInput): Letter {
  if (!clean(input.fullName)) throw new LetterInputError('Le nom est obligatoire.');
  if (!clean(input.siteName)) throw new LetterInputError('Le nom du site est obligatoire.');
  switch (input.kind) {
    case 'effacement':
      return effacement(input);
    case 'acces':
      return acces(input);
    case 'relance':
      return relance(input);
  }
}

/** Texte complet prêt à copier : objet puis corps. */
export function letterToText(letter: Letter): string {
  return `Objet : ${letter.subject}\n\n${letter.body}\n`;
}

/** Lien mailto: ouvert dans le logiciel de messagerie de la personne, rien ne transite par Shred. */
export function mailtoHref(letter: Letter, to = ''): string {
  const params = `subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`;
  return `mailto:${to.trim().replace(/[?&#\s]/g, '')}?${params}`;
}
