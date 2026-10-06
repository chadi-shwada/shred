import type { CSSProperties } from 'react';

const STRIPS = 14;

/**
 * Petite pluie de bandes de papier, comme à la sortie d'un broyeur (décoratif).
 * À monter avec une clé qui change pour rejouer l'animation. Masquée si
 * prefers-reduced-motion (voir global.css).
 */
export function ShredBurst({ tone = 'brand' }: { tone?: 'brand' | 'ok' }) {
  return (
    <span className={`shred-burst shred-burst--${tone}`} aria-hidden="true">
      {Array.from({ length: STRIPS }, (_, i) => (
        <span
          key={i}
          style={
            {
              '--x': `${(i + 0.5) * (100 / STRIPS)}%`,
              '--d': `${(i % 5) * 45}ms`,
              '--r': `${(i % 2 === 0 ? 1 : -1) * (4 + (i % 4) * 5)}deg`,
              '--h': `${38 + ((i * 7) % 5) * 9}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
