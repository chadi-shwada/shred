/**
 * Génération des lettres RGPD.
 *
 * Les modèles sont indicatifs et ne constituent pas un conseil juridique.
 * Ils s'inspirent de la structure du modèle de la CNIL
 * (cnil.fr/modele/courrier/supprimer-des-donnees-personnelles) :
 * article 17.1 pour l'effacement, article 12.3 pour le délai d'un mois,
 * article 19 pour la notification aux destinataires.
 *
 * Deux contextes :
 * - « exposition » : un site publie des données issues d'une fuite (art. 17.1 d, 17.2) ;
 * - « violation » : l'entreprise a elle-même subi la fuite. La lettre demande alors
 *   aussi la description de la violation (art. 34.2, qui renvoie à l'art. 33.3 b, c, d).
 *
 * Signalements (hors RGPD pour la procédure, RGPD pour l'illégalité) :
 * - hébergeur : notification au titre de l'article 16 du règlement (UE) 2022/2065
 *   (DSA), avec ses quatre éléments obligatoires (art. 16.2) : explication de
 *   l'illégalité, URL exactes, nom et e-mail, déclaration de bonne foi ;
 * - registrar et Cloudflare : pas des hébergeurs au sens du DSA ; demande au titre
 *   de leur politique anti-abus, de transmission et d'identification de l'hébergeur.
 *
 * Toute modification d'une lettre cite l'article concerné et met à jour
 * letters.test.ts.
 */

import { formatLongFr, gdprDeadlines, type IsoDate } from './dates';

export type LetterKind = 'effacement' | 'acces' | 'opposition' | 'fermeture' | 'relance' | 'signalement';
/** Demandes RGPD avec délai légal de réponse (art. 12.3), suivies dans le suivi. */
export type InitialKind = 'effacement' | 'acces' | 'opposition' | 'fermeture';

/** Table de référence des demandes RGPD : libellé, nom dans une phrase, article fondateur. */
export const INITIAL_KINDS: Record<InitialKind, { label: string; noun: string; article: string }> = {
  effacement: { label: 'Effacement', noun: "demande d'effacement de mes données personnelles", article: '17' },
  acces: { label: 'Accès', noun: "demande d'accès à mes données personnelles", article: '15' },
  opposition: { label: 'Opposition', noun: 'opposition au traitement de mes données personnelles', article: '21' },
  fermeture: {
    label: 'Fermeture de compte',
    noun: "demande de fermeture de mon compte et d'effacement de mes données",
    article: '17',
  },
};

export function isInitialKind(value: unknown): value is InitialKind {
  return typeof value === 'string' && value in INITIAL_KINDS;
}
/** Destinataire d'un signalement. */
export type ReportTarget = 'hebergeur' | 'registrar' | 'cloudflare';
export type LetterContext = 'exposition' | 'violation';

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
  /** Exposition par un site tiers (par défaut) ou violation subie par l'entreprise elle-même. */
  context?: LetterContext;
  /** Violation seulement : nom public de la fuite (ex. référence Have I Been Pwned). */
  breachName?: string;
  /** Violation seulement : date de la fuite. */
  breachDate?: IsoDate;
  /** Signalement seulement : à qui il est adressé. */
  reportTarget?: ReportTarget;
}

export interface Letter {
  subject: string;
  body: string;
  /** Articles du RGPD cités dans la lettre, dans l'ordre d'apparition. */
  articles: string[];
}

const SALUTATION = 'Madame, Monsieur,';
const CLOSING = "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";
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

function isViolation(input: LetterInput): boolean {
  return input.context === 'violation';
}

function locationParagraph(input: LetterInput, intro: string): string | null {
  const urls = urlList(input);
  const data = dataList(input);
  const parts: string[] = [];
  if (urls.length > 0) parts.push(`${intro}\n${bulletList(urls)}`);
  if (data.length > 0) {
    const label = isViolation(input)
      ? "D'après les informations publiques sur cette fuite, les catégories de données exposées sont :"
      : 'Les données concernées sont :';
    parts.push(`${label}\n${bulletList(data)}`);
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
}

/** « la violation de données « Exemple » (date : 3 mars 2024) », selon ce qui est connu. */
function breachReference(input: LetterInput): string {
  const name = clean(input.breachName);
  const date = input.breachDate;
  let ref = '';
  if (name) ref += ` (référencée sous le nom « ${name} »`;
  if (date) ref += `${name ? ', ' : ' ('}datée du ${formatLongFr(date)}`;
  if (ref) ref += ')';
  return ref;
}

function violationIntro(input: LetterInput): string {
  return `J'ai appris que des données personnelles me concernant ont été exposées lors d'une violation de données subie par ${clean(input.siteName)}${breachReference(input)}.`;
}

const BREACH_DETAILS =
  "Si cette violation est susceptible d'engendrer un risque élevé pour mes droits et libertés, l'article 34 du RGPD vous impose de m'en informer. Je vous demande dans tous les cas de me décrire la nature de cette violation, ses conséquences probables, les mesures prises pour y remédier et en atténuer les effets, ainsi que les coordonnées de votre délégué à la protection des données (article 34.2, qui renvoie à l'article 33.3).";

const DEADLINE =
  "L'article 12.3 du RGPD vous impose de me répondre dans les meilleurs délais et au plus tard dans un délai d'un mois à compter de la réception de cette demande. Cette démarche est gratuite (article 12.5 du RGPD).";

const COMPLAINT =
  "À défaut de réponse satisfaisante dans ce délai, je me réserve la possibilité d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD.";

const NOTIFY_RECIPIENTS =
  "Conformément à l'article 19 du RGPD, je vous demande également de notifier cet effacement à chaque destinataire auquel ces données ont été communiquées.";

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
  return [SALUTATION, ...paragraphs.filter((p): p is string => p !== null), CLOSING, signature(input)].join('\n\n');
}

function effacement(input: LetterInput): Letter {
  const subject = "Demande d'effacement de données personnelles (article 17 du RGPD)";
  if (isViolation(input)) {
    return {
      subject,
      body: assemble(
        [
          violationIntro(input),
          locationParagraph(input, 'Elles apparaissent notamment aux adresses suivantes :'),
          identificationParagraph(input),
          `En application de l'article 17.1 du ${RGPD}, je vous demande d'effacer l'ensemble des données me concernant, dans la mesure où elles ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées (point a) ou où je retire mon consentement à leur traitement (point b).`,
          NOTIFY_RECIPIENTS,
          BREACH_DETAILS,
          DEADLINE,
          COMPLAINT,
        ],
        input,
      ),
      articles: ['17.1', '19', '34', '34.2', '33.3', '12.3', '12.5', '77'],
    };
  }
  const site = clean(input.siteName);
  const body = assemble(
    [
      `Le site ${site} publie ou rend accessibles des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données. Je n'ai jamais consenti à cette diffusion.`,
      locationParagraph(input, 'Elles apparaissent notamment aux adresses suivantes :'),
      identificationParagraph(input),
      `En application de l'article 17.1 du ${RGPD}, et notamment de son point d) (données ayant fait l'objet d'un traitement illicite), je vous demande d'effacer ces données dans les meilleurs délais.`,
      "Ces données ayant été rendues publiques, je vous demande, conformément à l'article 17.2 du RGPD, de prendre les mesures raisonnables pour informer les autres responsables de traitement qui les reproduisent de ma demande d'effacement de tout lien vers ces données et de toute copie de celles-ci.",
      NOTIFY_RECIPIENTS,
      DEADLINE,
      COMPLAINT,
    ],
    input,
  );
  return { subject, body, articles: ['17.1', '17.2', '19', '12.3', '12.5', '77'] };
}

function accessRequest(extra: string): string {
  return `En application de l'article 15 du ${RGPD}, je vous demande de me confirmer si vous traitez des données me concernant et, si c'est le cas, de m'en communiquer une copie (article 15.3), ainsi que les informations suivantes :\n${bulletList(
    [
      'les finalités du traitement ;',
      'les catégories de données concernées ;',
      'les destinataires auxquels ces données ont été ou seront communiquées ;',
      'la durée de conservation envisagée ;',
      extra,
    ],
  )}`;
}

function acces(input: LetterInput): Letter {
  const subject = "Demande d'accès à mes données personnelles (article 15 du RGPD)";
  if (isViolation(input)) {
    return {
      subject,
      body: assemble(
        [
          violationIntro(input),
          locationParagraph(input, 'Elles semblent apparaître aux adresses suivantes :'),
          identificationParagraph(input),
          accessRequest('la liste précise des données me concernant touchées par cette violation.'),
          BREACH_DETAILS,
          DEADLINE,
          COMPLAINT,
        ],
        input,
      ),
      articles: ['15', '15.3', '34', '34.2', '33.3', '12.3', '12.5', '77'],
    };
  }
  const site = clean(input.siteName);
  const body = assemble(
    [
      `J'ai des raisons de penser que le site ${site} traite des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données.`,
      locationParagraph(input, 'Elles semblent apparaître aux adresses suivantes :'),
      identificationParagraph(input),
      accessRequest(
        "toute information disponible sur la source de ces données, puisqu'elles n'ont pas été collectées auprès de moi (article 15.1 g).",
      ),
      DEADLINE,
      COMPLAINT,
    ],
    input,
  );
  return { subject, body, articles: ['15', '15.3', '15.1 g', '12.3', '12.5', '77'] };
}

function relance(input: LetterInput): Letter {
  const previousDate = input.previousRequestDate;
  const previousKind = input.previousKind;
  if (!previousDate || !previousKind) {
    throw new LetterInputError('Une relance demande la date et la nature de la première demande.');
  }
  const site = clean(input.siteName);
  const previous = INITIAL_KINDS[previousKind];
  const deadline = gdprDeadlines(previousDate).standard;
  const body = assemble(
    [
      `Le ${formatLongFr(previousDate)}, je vous ai adressé une ${previous.noun}, fondée sur l'article ${previous.article} du ${RGPD}, au sujet de données me concernant ${
        isViolation(input)
          ? `exposées lors d'une violation de données subie par ${site}${breachReference(input)}`
          : `diffusées sur le site ${site}`
      }.`,
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

function opposition(input: LetterInput): Letter {
  const site = clean(input.siteName);
  const body = assemble(
    [
      `Je reçois de ${site} des sollicitations commerciales (e-mails, SMS ou appels) auxquelles je n'ai jamais consenti. Je soupçonne que mes coordonnées proviennent d'une fuite de données.`,
      locationParagraph(input, 'Ces sollicitations font notamment référence aux pages suivantes :'),
      identificationParagraph(input),
      `En application de l'article 21.2 du ${RGPD}, je m'oppose au traitement de mes données à des fins de prospection, y compris au profilage lié à cette prospection. Conformément à l'article 21.3 du RGPD, mes données ne doivent plus être traitées à ces fins.`,
      "Je m'oppose également, au titre de l'article 21.1 du RGPD, à tout autre traitement de mes données fondé sur votre intérêt légitime : il vous appartient de démontrer l'existence de motifs légitimes et impérieux qui prévaudraient sur mes droits.",
      "En conséquence, je vous demande d'effacer mes données (article 17.1 c du RGPD) et de m'indiquer leur source, puisqu'elles n'ont pas été collectées auprès de moi (article 15.1 g du RGPD).",
      DEADLINE,
      COMPLAINT,
    ],
    input,
  );
  return {
    subject: 'Opposition au traitement de mes données personnelles (article 21 du RGPD)',
    body,
    articles: ['21.2', '21.3', '21.1', '17.1 c', '15.1 g', '12.3', '12.5', '77'],
  };
}

function fermeture(input: LetterInput): Letter {
  const violation = isViolation(input);
  const body = assemble(
    [
      violation
        ? `${violationIntro(input)} Je ne souhaite plus utiliser votre service.`
        : `Je suis titulaire d'un compte sur ${clean(input.siteName)} et je ne souhaite plus utiliser ce service.`,
      locationParagraph(input, 'Pour référence, les pages concernées sont les suivantes :'),
      identificationParagraph(input),
      `Je vous demande de clôturer mon compte et, en application de l'article 17.1 du ${RGPD}, d'effacer l'ensemble des données me concernant : je retire mon consentement à leur traitement (articles 7.3 et 17.1 b) et elles ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées (article 17.1 a).`,
      'Si certaines données doivent être conservées pour respecter une obligation légale (article 17.3 b du RGPD), je vous demande de me préciser lesquelles, sur quel fondement et pour quelle durée.',
      NOTIFY_RECIPIENTS,
      violation ? BREACH_DETAILS : null,
      DEADLINE,
      COMPLAINT,
    ],
    input,
  );
  return {
    subject: "Fermeture de compte et demande d'effacement de mes données (article 17 du RGPD)",
    body,
    articles: violation
      ? ['17.1', '7.3', '17.3 b', '19', '34', '34.2', '33.3', '12.3', '12.5', '77']
      : ['17.1', '7.3', '17.3 b', '19', '12.3', '12.5', '77'],
  };
}

const ILLEGALITY =
  "Ces données sont diffusées sans mon consentement et sans aucune autre base légale prévue à l'article 6 du règlement (UE) 2016/679 (RGPD). Leur publication constitue un traitement illicite de données personnelles, contraire aux articles 5 et 6 du RGPD.";

const GOOD_FAITH =
  'Je déclare de bonne foi que les informations et allégations contenues dans ce signalement sont exactes et complètes.';

function signalement(input: LetterInput): Letter {
  const target = input.reportTarget ?? 'hebergeur';
  if (urlList(input).length === 0) {
    throw new LetterInputError("Un signalement doit indiquer l'adresse exacte (URL) d'au moins une page.");
  }
  if (!clean(input.email)) {
    throw new LetterInputError('Un signalement doit indiquer ton adresse e-mail.');
  }
  const site = clean(input.siteName);
  const intro: Record<ReportTarget, string> = {
    hebergeur: `Votre service héberge le site ${site}, qui publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
    registrar: `Le nom de domaine du site ${site} est enregistré auprès de vos services. Ce site publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
    cloudflare: `Le site ${site} utilise vos services. Il publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
  };
  const request: Record<ReportTarget, string> = {
    hebergeur:
      "En application de l'article 16 du règlement (UE) 2022/2065 sur les services numériques (DSA), je vous notifie ce contenu illicite et vous demande de le retirer ou d'en rendre l'accès impossible dans les meilleurs délais, puis de m'informer de votre décision.",
    registrar:
      "Je vous demande de prendre les mesures prévues par vos conditions d'utilisation et votre politique de lutte contre les abus, de transmettre ce signalement au titulaire du nom de domaine et de m'informer des suites données.",
    cloudflare:
      "Je vous demande de transmettre ce signalement à l'hébergeur du site et au titulaire du compte, et de me communiquer l'identité de l'hébergeur afin que je puisse le saisir directement.",
  };
  const subject: Record<ReportTarget, string> = {
    hebergeur:
      "Signalement de contenu illicite : données personnelles issues d'une fuite (article 16 du règlement (UE) 2022/2065)",
    registrar: "Signalement d'abus : publication de données personnelles issues d'une fuite",
    cloudflare: "Signalement d'abus : publication de données personnelles issues d'une fuite",
  };
  const body = assemble(
    [
      intro[target],
      locationParagraph(input, 'Les pages concernées sont les suivantes :'),
      ILLEGALITY,
      request[target],
      GOOD_FAITH,
    ],
    input,
  );
  return {
    subject: subject[target],
    body,
    articles: target === 'hebergeur' ? ['6 RGPD', '5 RGPD', '16 DSA'] : ['6 RGPD', '5 RGPD'],
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
    case 'opposition':
      return opposition(input);
    case 'fermeture':
      return fermeture(input);
    case 'relance':
      return relance(input);
    case 'signalement':
      return signalement(input);
  }
}

/** Texte complet prêt à copier : objet puis corps. */
export function letterToText(letter: Letter): string {
  return `Objet : ${letter.subject}\n\n${letter.body}\n`;
}

/** Lien mailto: ouvert dans le logiciel de messagerie de la personne, rien ne transite par ShredRGPD. */
export function mailtoHref(letter: Letter, to = ''): string {
  const params = `subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`;
  return `mailto:${to.trim().replace(/[?&#\s]/g, '')}?${params}`;
}
