/**
 * Logos des entreprises, téléchargés au build par scripts/fetch-breaches.mjs
 * dans public/logos/ (servis par le site, aucune requête externe). Le
 * manifeste { nom HIBP: { src, light } } peut manquer : les fuites gardent
 * alors leur médaillon. light : logo clair, à poser sur un fond sombre.
 */

export interface BreachLogo {
  src: string;
  light: boolean;
}

const modules = import.meta.glob<Record<string, BreachLogo | string>>('./data/breach-logos.generated.json', {
  eager: true,
  import: 'default',
});

const LOGOS = modules['./data/breach-logos.generated.json'] ?? {};

export function breachLogo(name: string): BreachLogo | undefined {
  if (!Object.hasOwn(LOGOS, name)) return undefined;
  const entry = LOGOS[name]!;
  // Ancien format du manifeste : chemin seul.
  return typeof entry === 'string' ? { src: entry, light: false } : entry;
}
