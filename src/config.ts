/** Réglages du site, regroupés ici pour être modifiés en une ligne. */

/** Adresse publique du site (aperçus de partage, sitemap). */
export const SITE_URL = 'https://shred-delta.vercel.app';

/** Auteur, affiché dans le pied de page et les mentions légales. */
export const AUTHOR = { name: 'Cha4Sh', url: 'https://x.com/Cha4Sh' } as const;

/**
 * Lien vers le code source (dépôt public depuis le 6 octobre 2026). Avec null,
 * les liens « Code source » et la mention « code ouvert » sont masqués.
 */
export const SOURCE_CODE_URL: string | null = 'https://github.com/chadi-shwada/shred';

export const SITE_TITLE = "ShredRGPD · Demande l'effacement de tes données";
export const SITE_DESCRIPTION =
  'Vérifie ce qui a fuité et demande l’effacement de tes données personnelles avec une lettre RGPD. Gratuit, sans compte, sans traceur : tes données restent dans ton navigateur.';
