/**
 * Vidéo de présentation du site (public/videos/shred-presentation.*) : le
 * principe de ShredRGPD en 45 s, en animation (pas de démo pas à pas). Sans
 * paroles : le texte est incrusté à l'image, repris ici pour les sous-titres et
 * la transcription. Bande-son (musique et bruitages) synthétisée par code, sans
 * échantillon externe ; coupée sur l'accueil, où la vidéo démarre seule.
 * Fuites réelles (catalogue Have I Been Pwned, chiffres du 5 octobre 2026),
 * personne fictive.
 * Les fichiers .mp4 sont produits hors du dépôt (animation HTML rendue image
 * par image avec Playwright) ; après une nouvelle version, régénérer le .vtt
 * depuis ce fichier (toVtt) et ajuster les temps.
 */

import type { Cue } from '../lib/vtt';

export interface Video {
  id: string;
  title: string;
  /** Durée lisible, affichée à côté du titre. */
  duration: string;
  src: string;
  poster: string;
  captions: string;
  cues: Cue[];
}

export const PRESENTATION: Video = {
  id: 'presentation',
  title: 'ShredRGPD en 45 secondes',
  duration: '45 s',
  src: '/videos/shred-presentation.mp4',
  poster: '/videos/shred-presentation.jpg',
  captions: '/videos/shred-presentation.vtt',
  cues: [
    {
      start: 0,
      end: 5,
      text: '[Musique douce et bruitages] Tes données ont fuité. 1 039 fuites connues, dont 27 en France. Autour, des bribes de données masquées : e-mail, mot de passe, IBAN, date de naissance.',
    },
    {
      start: 5,
      end: 9.3,
      text: 'Un extrait de la fuite Deezer de 2019 passe au broyeur. ShredRGPD : demande l’effacement de tes données. Gratuit, sans compte, sans traceur.',
    },
    {
      start: 9.3,
      end: 16.1,
      step: '01. Vérifier',
      text: 'Vois ce qui a fuité. Cherche ton e-mail sur Have I Been Pwned, coche les fuites : Free, Deezer (logos des entreprises, marques de leurs propriétaires). Ton e-mail ne passe jamais par ShredRGPD.',
    },
    {
      start: 16.1,
      end: 23.6,
      step: '02. Écrire',
      text: 'Ta lettre RGPD, en 5 étapes, pré-remplie depuis la fuite Free, avec les bons articles du RGPD (17.1, 19, 34, 12.3). À copier, envoyer ou imprimer.',
    },
    {
      start: 23.6,
      end: 30.1,
      step: '03. Suivre',
      text: 'Le délai, calculé pour toi : l’entreprise a un mois pour répondre (article 12.3 du RGPD). Délai dépassé ? Relance prête, plainte CNIL.',
    },
    {
      start: 30.1,
      end: 35.6,
      step: 'Mot de passe',
      text: 'Teste-le sans le confier. Son empreinte SHA-1 est calculée dans ton navigateur ; seuls ses 5 premiers caractères partent vers Pwned Passwords. La comparaison se fait chez toi.',
    },
    {
      start: 35.6,
      end: 40.1,
      text: 'Tes données restent chez toi : 0 serveur, 0 traceur, 0 compte, 100 % dans ton navigateur.',
    },
    {
      start: 40.1,
      end: 45,
      text: 'Reprends le contrôle de tes données. shredrgpd.fr. Gratuit, sans compte. Modèles de lettres indicatifs, pas un conseil juridique.',
    },
  ],
};
