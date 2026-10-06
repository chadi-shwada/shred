import type { CSSProperties } from 'react';

/** Teinte stable tirée du nom (même fuite, même couleur). */
function hue(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return h;
}

/**
 * Médaillon décoratif d'une fuite : l'initiale de l'entreprise sur une couleur
 * tirée de son nom. Pas de logo (droit des marques, aucune requête externe).
 */
export function BreachMark({ title, size = 'md' }: { title: string; size?: 'sm' | 'md' | 'lg' }) {
  const initial = title.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`breach-mark breach-mark--${size}`}
      style={{ '--mark-hue': hue(title) } as CSSProperties}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
