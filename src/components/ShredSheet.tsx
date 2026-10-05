import { useId } from 'react';

/**
 * Animation d'accueil (décorative) : une lettre entre dans un destructeur
 * et ressort en bandes. Respecte prefers-reduced-motion (voir global.css).
 */

const STRIPS = Array.from({ length: 10 }, (_, i) => i);

export function ShredSheet() {
  const id = useId().replace(/:/g, '');
  const top = `${id}-top`;
  const bottom = `${id}-bottom`;

  return (
    <svg className="shred" viewBox="0 0 240 300" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={top}>
          <rect x="0" y="-40" width="240" height="182" />
        </clipPath>
        <clipPath id={bottom}>
          <rect x="0" y="196" width="240" height="120" />
        </clipPath>
      </defs>

      {/* Feuille */}
      <g clipPath={`url(#${top})`}>
        <g className="shred__sheet">
          <rect x="62" y="-8" width="116" height="150" rx="3" fill="var(--paper)" stroke="var(--line-strong)" />
          <rect x="76" y="8" width="44" height="6" rx="3" fill="var(--accent)" />
          {[26, 40, 50, 60, 70, 84, 94, 104, 114].map((y, i) => (
            <rect key={y} x="76" y={y} width={i % 3 === 2 ? 56 : 88} height="4" rx="2" fill="var(--line-strong)" />
          ))}
        </g>
      </g>

      {/* Destructeur */}
      <rect x="22" y="138" width="196" height="58" rx="12" fill="var(--ink)" />
      <rect x="48" y="150" width="144" height="6" rx="3" fill="var(--bg)" opacity="0.18" />
      <circle cx="196" cy="180" r="4" fill="var(--accent)" />
      <rect x="40" y="176" width="40" height="5" rx="2.5" fill="var(--bg)" opacity="0.18" />

      {/* Bandes */}
      <g clipPath={`url(#${bottom})`}>
        {STRIPS.map((i) => (
          <rect
            key={i}
            className="shred__strip"
            x={64 + i * 11.4}
            y="198"
            width="8.6"
            height={i % 2 === 0 ? 96 : 84}
            rx="1.5"
            fill="var(--paper)"
            stroke="var(--line-strong)"
          />
        ))}
      </g>
    </svg>
  );
}
