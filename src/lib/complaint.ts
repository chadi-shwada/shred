/**
 * Récapitulatif à coller dans le formulaire de plainte de la CNIL (article 77
 * du RGPD), à partir d'une demande du suivi. Rien n'est envoyé : c'est du texte.
 */

import { formatLongFr, gdprDeadlines, type IsoDate } from './dates';
import type { TrackedRequest } from './tracking';

export const CNIL_COMPLAINT_URL = 'https://www.cnil.fr/fr/adresser-une-plainte';

const KIND_TEXT = {
  effacement: { noun: "une demande d'effacement de mes données personnelles", article: '17' },
  acces: { noun: "une demande d'accès à mes données personnelles", article: '15' },
} as const;

export function complaintSummary(request: TrackedRequest, today: IsoDate): string {
  const kind = KIND_TEXT[request.kind];
  const deadline = gdprDeadlines(request.sentOn)[request.status === 'prolongee' ? 'extended' : 'standard'];
  const lines = [
    `Organisme concerné : ${request.site}`,
    '',
    `Le ${formatLongFr(request.sentOn)}, j'ai adressé à cet organisme ${kind.noun}, fondée sur l'article ${kind.article} du RGPD.`,
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
