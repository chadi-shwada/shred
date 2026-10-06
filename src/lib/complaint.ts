/**
 * Récapitulatif à coller dans le formulaire de plainte de la CNIL (article 77
 * du RGPD), à partir d'une demande du suivi. Rien n'est envoyé : c'est du texte.
 */

import { formatLongFr, gdprDeadlines, type IsoDate } from './dates';
import { INITIAL_KINDS } from './letters';
import type { TrackedRequest } from './tracking';

export const CNIL_COMPLAINT_URL = 'https://www.cnil.fr/fr/adresser-une-plainte';

export function complaintSummary(request: TrackedRequest, today: IsoDate): string {
  const kind = INITIAL_KINDS[request.kind];
  const deadline = gdprDeadlines(request.sentOn)[request.status === 'prolongee' ? 'extended' : 'standard'];
  const lines = [
    `Organisme concerné : ${request.site}`,
    '',
    `Le ${formatLongFr(request.sentOn)}, j'ai adressé à cet organisme une ${kind.noun}, fondée sur l'article ${kind.article} du RGPD.`,
    `Le délai de réponse prévu à l'article 12.3 du RGPD expirait le ${formatLongFr(deadline)}.`,
    request.status === 'relancee'
      ? "Je l'ai relancé, sans réponse satisfaisante à ce jour."
      : "Je n'ai pas reçu de réponse satisfaisante à ce jour.",
    `Date de ce récapitulatif : ${formatLongFr(today)}.`,
  ];
  const notes = request.notes.trim();
  if (notes) lines.push('', `Précisions : ${notes}`);
  lines.push(
    '',
    "Je joins une copie de ma demande, de ma relance éventuelle et des éléments montrant la diffusion de mes données (captures d'écran datées, adresses des pages).",
  );
  return lines.join('\n');
}

/**
 * Dossier complet à joindre à une plainte : récapitulatif, puis le texte de
 * chaque lettre gardée en copie dans le suivi.
 */
export function cnilDossier(request: TrackedRequest, today: IsoDate): string {
  const parts = [
    'DOSSIER DE PLAINTE CNIL (préparé avec ShredRGPD, modèle indicatif)',
    '',
    complaintSummary(request, today),
  ];
  const letters = request.letters ?? [];
  parts.push('', '', `LETTRES ENVOYÉES (${letters.length})`);
  if (letters.length === 0) {
    parts.push('', 'Aucune copie gardée dans le suivi. Joins les lettres que tu as envoyées.');
  }
  for (const letter of letters) {
    parts.push('', `--- ${formatLongFr(letter.date)} : ${letter.subject} ---`, '', letter.body);
  }
  parts.push(
    '',
    '',
    'PIÈCES À JOINDRE',
    "- captures d'écran datées des pages qui exposent tes données ;",
    "- preuves d'envoi et de réception (accusés, captures, numéros de ticket) ;",
    '- réponses éventuelles de l’organisme.',
  );
  return parts.join('\n');
}
