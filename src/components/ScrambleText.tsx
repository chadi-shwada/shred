import { useEffect, useState } from 'react';

/**
 * Texte qui se « décode » depuis du binaire à l'affichage (décoratif).
 * Le texte réel est toujours présent pour les lecteurs d'écran.
 * Aucun effet si prefers-reduced-motion.
 */

const DURATION = 1100;

function scramble(text: string, progress: number): string {
  const revealed = Math.floor(text.length * progress);
  return Array.from(text, (ch, i) => {
    if (i < revealed || ch === ' ' || ch === ' ') return ch;
    return Math.random() < 0.5 ? '0' : '1';
  }).join('');
}

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export function ScrambleText({ text, className }: ScrambleTextProps) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start - 250) / DURATION);
      setShown(progress <= 0 ? scramble(text, 0) : scramble(text, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <span className={className}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
