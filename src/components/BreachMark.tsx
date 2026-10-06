import type { CSSProperties } from 'react';
import { breachLogo } from '../breachLogos';

/** Teinte stable tirée du nom (même fuite, même couleur). */
function hue(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return h;
}

/**
 * Repère visuel d'une fuite (décoratif, le nom est écrit à côté) : le logo de
 * l'entreprise s'il a été téléchargé au build (src/breachLogos.ts), sur fond
 * blanc, ou sombre si le logo est clair ; sinon son
 * initiale sur une couleur tirée du nom.
 */
export function BreachMark({ title, name, size = 'md' }: { title: string; name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const logo = name ? breachLogo(name) : undefined;
  if (logo) {
    return (
      <span
        className={`breach-mark breach-mark--${size} breach-mark--logo${logo.light ? ' breach-mark--logo-light' : ''}`}
        aria-hidden="true"
      >
        <img src={logo.src} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }
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
