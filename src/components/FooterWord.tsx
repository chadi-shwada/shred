import { useRef, type PointerEvent } from 'react';

/**
 * Grand mot « ShredRGPD » en bandes verticales (décoratif), rappel du logo.
 * Gris au repos ; au survol, un dégradé coloré suit le pointeur.
 */
export function FooterWord() {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--y', `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className="footer-word" aria-hidden="true" onPointerMove={onPointerMove}>
      <span className="footer-word__base" data-text="ShredRGPD" />
      <span className="footer-word__glow" data-text="ShredRGPD" />
    </div>
  );
}
