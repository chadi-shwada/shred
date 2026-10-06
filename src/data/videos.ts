/**
 * Vidéos du site (fichiers dans public/videos/). Muettes : le texte est
 * incrusté à l'image, repris ici pour les sous-titres et la transcription.
 * Fuites réelles (catalogue Have I Been Pwned), personne fictive.
 * Les fichiers .mp4 sont produits hors du dépôt (rendu image par image du site
 * avec Playwright) ; après une nouvelle version, régénérer les .vtt depuis ce
 * fichier (toVtt) et ajuster les temps.
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

export const EXPLAINER: Video = {
  id: 'explication',
  title: 'Shred en 50 secondes',
  duration: '50 s',
  src: '/videos/shred-explication.mp4',
  poster: '/videos/shred-explication.jpg',
  captions: '/videos/shred-explication.vtt',
  cues: [
    {
      start: 0,
      end: 4.2,
      text: 'Une fiche de la fuite Deezer de 2019 : nom, e-mail, date de naissance, adresse IP. Les lignes sont barrées une à une.',
    },
    { start: 4.2, end: 8.2, text: 'Tes données ont fuité. Et maintenant ?' },
    { start: 8.2, end: 13.2, text: 'Shred : demande l’effacement de tes données. Gratuit, sans compte, sans traceur.' },
    {
      start: 13.2,
      end: 18.6,
      text: 'Un site gratuit, en français, pensé pour exercer tes droits RGPD, sans conseil juridique.',
    },
    {
      start: 18.6,
      end: 25.6,
      text: '01. Vérifie ce qui a fuité. La recherche se fait sur Have I Been Pwned : ton e-mail ne passe jamais par Shred.',
    },
    {
      start: 25.6,
      end: 32.8,
      text: '02. Génère ta lettre RGPD. Effacement, accès, opposition, relance : les articles sont cités pour toi.',
    },
    {
      start: 32.8,
      end: 39.8,
      text: '03. Suis les délais, relance. Un mois pour répondre (art. 12.3). Ensuite : relance, rappel, plainte CNIL.',
    },
    {
      start: 39.8,
      end: 45,
      text: 'Tes données restent chez toi : 0 serveur, 0 traceur, 0 compte, 0 publicité. Le suivi est stocké dans ton navigateur. Shred n’héberge aucune base de fuites.',
    },
    {
      start: 45,
      end: 50,
      text: 'Reprends le contrôle de tes données. shred-delta.vercel.app. Modèles de lettres indicatifs, pas un conseil juridique.',
    },
  ],
};

export const DEMO: Video = {
  id: 'demo',
  title: 'La démo complète, de A à Z',
  duration: '2 min',
  src: '/videos/shred-demo.mp4',
  poster: '/videos/shred-demo.jpg',
  captions: '/videos/shred-demo.vtt',
  cues: [
    {
      start: 0,
      end: 5.167,
      text: "Shred, de A à Z : comment demander l'effacement de tes données après une fuite, en 5 étapes. Fuite réelle (Deezer, 2019), personne fictive.",
    },
    { start: 5.167, end: 9.767, text: "On part de l'accueil de Shred. Gratuit, sans compte." },
    {
      start: 9.767,
      end: 14.133,
      step: 'Étape 1 : Cherche tes fuites',
      text: 'Choisis ta situation. Ici : « Je veux savoir si je suis concerné ».',
    },
    {
      start: 14.133,
      end: 19.7,
      step: 'Étape 1 : Cherche tes fuites',
      text: 'Cherche ton adresse e-mail sur Have I Been Pwned, dans un nouvel onglet. Ton e-mail ne passe jamais par Shred.',
    },
    {
      start: 19.7,
      end: 24.867,
      step: 'Étape 1 : Cherche tes fuites',
      text: 'Astuce : colle ici la page de résultats, Shred coche les fuites pour toi.',
    },
    {
      start: 24.867,
      end: 32.067,
      step: 'Étape 2 : Coche la fuite',
      text: 'Tu peux aussi chercher la fuite par son nom. Disons que ton adresse figure dans la fuite Deezer de 2019.',
    },
    {
      start: 32.067,
      end: 36.067,
      step: 'Étape 2 : Coche la fuite',
      text: 'Coche-la : Shred affiche les données exposées et un plan d’action.',
    },
    {
      start: 36.067,
      end: 41.533,
      step: 'Étape 3 : Comprends ce qui a fuité',
      text: 'Dates de naissance, e-mails, adresses IP, localisation… Voilà ce qui a fuité chez Deezer.',
    },
    {
      start: 41.533,
      end: 45.933,
      step: 'Étape 3 : Comprends ce qui a fuité',
      text: 'Coche les bons réflexes au fur et à mesure. Ta progression reste dans ce navigateur.',
    },
    {
      start: 45.933,
      end: 51.333,
      step: 'Étape 3 : Comprends ce qui a fuité',
      text: "Puis écris à l'entreprise en un clic : effacement, ou demande de ce qui a fuité.",
    },
    {
      start: 51.333,
      end: 56.1,
      step: 'Étape 4 : Écris à l’entreprise',
      text: 'La lettre est pré-remplie depuis la fuite : type, entreprise, date, données. Il reste une étape.',
    },
    {
      start: 56.1,
      end: 62.333,
      step: 'Étape 4 : Écris à l’entreprise',
      text: "Ajoute ton nom. Rien n'est envoyé, rien n'est enregistré.",
    },
    {
      start: 62.333,
      end: 68.4,
      step: 'Étape 4 : Écris à l’entreprise',
      text: 'Ta lettre est prête. Elle cite les articles du RGPD (17, 34…) et se relit avant l’envoi.',
    },
    {
      start: 68.4,
      end: 73.6,
      step: 'Étape 4 : Écris à l’entreprise',
      text: "Copie-la ou ouvre-la dans ta messagerie, puis envoie-la au délégué à la protection des données (DPO) de l'entreprise.",
    },
    {
      start: 73.6,
      end: 78.833,
      step: 'Étape 4 : Écris à l’entreprise',
      text: "Ajoute la demande au suivi pour ne pas rater l'échéance.",
    },
    {
      start: 78.833,
      end: 83.7,
      step: 'Étape 5 : Suis et relance',
      text: "L'entreprise a un mois pour répondre (article 12.3 du RGPD). Shred compte les jours.",
    },
    {
      start: 83.7,
      end: 88.133,
      step: 'Étape 5 : Suis et relance',
      text: 'Ajoute un rappel à ton agenda : un fichier .ics, compatible avec la plupart des calendriers.',
    },
    { start: 88.133, end: 90.767, text: 'Simulation : un mois plus tard, pas de réponse.' },
    {
      start: 90.767,
      end: 96.867,
      step: 'Étape 5 : Suis et relance',
      text: 'Le délai est dépassé. Shred le signale et prépare la relance.',
    },
    {
      start: 96.867,
      end: 102.3,
      step: 'Étape 5 : Suis et relance',
      text: 'La relance est pré-remplie : date de la première demande, entreprise, situation. Ajoute ton nom.',
    },
    {
      start: 102.3,
      end: 108.567,
      step: 'Étape 5 : Suis et relance',
      text: 'La relance rappelle le délai légal et la possibilité de saisir la CNIL (articles 12.3, 12.4 et 77).',
    },
    {
      start: 108.567,
      end: 117.167,
      step: 'Étape 5 : Suis et relance',
      text: 'Toujours rien après la relance ? Shred prépare ton dossier de plainte à la CNIL : récapitulatif, lettres, pièces à joindre.',
    },
    {
      start: 117.167,
      end: 121.833,
      text: 'Reprends le contrôle de tes données. Gratuit, sans compte, sans traceur : rien ne quitte ton navigateur. shred-delta.vercel.app. Modèles indicatifs, pas un conseil juridique.',
    },
  ],
};
