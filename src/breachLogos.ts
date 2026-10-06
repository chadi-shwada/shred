/**
 * Logos des entreprises, téléchargés au build par scripts/fetch-breaches.mjs
 * dans public/logos/ (servis par le site, aucune requête externe). Le
 * manifeste { nom HIBP: chemin } peut manquer : les fuites gardent alors leur
 * médaillon.
 */
const modules = import.meta.glob<Record<string, string>>('./data/breach-logos.generated.json', {
  eager: true,
  import: 'default',
});

const LOGOS: Record<string, string> = modules['./data/breach-logos.generated.json'] ?? {};

export function breachLogo(name: string): string | undefined {
  return Object.hasOwn(LOGOS, name) ? LOGOS[name] : undefined;
}
