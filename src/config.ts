/** Réglages du site, regroupés ici pour être modifiés en une ligne. */

/** Adresse publique du site (aperçus de partage, sitemap). */
export const SITE_URL = 'https://shred-delta.vercel.app';

/** Auteur, affiché dans le pied de page et les mentions légales. */
export const AUTHOR = { name: 'Cha4Sh', url: 'https://x.com/Cha4Sh' } as const;

/**
 * Lien vers le code source. null tant que le dépôt est privé : les liens et la
 * mention « code ouvert » sont alors masqués (un lien vers un dépôt privé renvoie 404).
 * Mettre l'adresse du dépôt ici le jour où il devient public.
 */
export const SOURCE_CODE_URL: string | null = null;

export const SITE_TITLE = "Shred · Demande l'effacement de tes données";
export const SITE_DESCRIPTION =
  'Vérifie ce qui a fuité et demande l’effacement de tes données personnelles avec une lettre RGPD. Gratuit, sans compte, sans traceur : tes données restent dans ton navigateur.';
