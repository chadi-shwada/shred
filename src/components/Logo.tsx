/**
 * Logo de Shred (décoratif) : une feuille qui passe dans une fente et sort en bandes.
 * Géométrie calée sur une grille de 24 pour rester nette en petite taille.
 */

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 28 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect width="24" height="24" rx="6" fill="var(--ink)" />
      <rect x="7" y="4" width="10" height="7" rx="1" fill="var(--bg)" />
      <rect x="4" y="11" width="16" height="2" rx="1" fill="var(--accent)" />
      <rect x="7" y="14" width="2" height="6" rx="1" fill="var(--bg)" />
      <rect x="11" y="14" width="2" height="5" rx="1" fill="var(--bg)" />
      <rect x="15" y="14" width="2" height="6" rx="1" fill="var(--bg)" />
    </svg>
  );
}

export function Logo() {
  return (
    <>
      <LogoMark />
      <span>Shred</span>
    </>
  );
}
