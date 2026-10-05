import { useEffect, useRef } from 'react';

/**
 * Champ de 0 et de 1 qui défilent (décoratif).
 * - Couleurs lues dans les tokens CSS (--bit, --bit-hot) : suit le thème.
 * - En pause hors écran ou onglet caché ; image fixe si prefers-reduced-motion.
 */

const CELL = 18;
const FONT_SIZE = 13;
const FPS = 24;

interface Drop {
  y: number;
  speed: number;
}

interface BinaryFieldProps {
  /** Part des colonnes animées (0 à 1). */
  density?: number;
}

export function BinaryField({ density = 0.35 }: BinaryFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cols = 0;
    let rows = 0;
    let chars: string[] = [];
    let life: Float32Array = new Float32Array(0);
    let drops: (Drop | null)[] = [];
    let frame = 0;
    let last = 0;
    let visible = true;
    let colors = { bit: 'rgba(110,135,255,0.25)', hot: '#c3ceff' };

    const bit = () => (Math.random() < 0.5 ? '0' : '1');

    const readColors = () => {
      const style = getComputedStyle(canvas);
      colors = {
        bit: style.getPropertyValue('--bit').trim() || colors.bit,
        hot: style.getPropertyValue('--bit-hot').trim() || colors.hot,
      };
    };

    const newDrop = (): Drop | null =>
      Math.random() < density ? { y: -Math.random() * rows, speed: 0.25 + Math.random() * 0.6 } : null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(rect.width / CELL);
      rows = Math.ceil(rect.height / CELL);
      chars = Array.from({ length: cols * rows }, bit);
      life = new Float32Array(cols * rows);
      drops = Array.from({ length: cols }, newDrop);
      if (reduced) {
        for (let i = 0; i < life.length; i++) life[i] = Math.random() < 0.08 ? Math.random() : 0;
      }
      readColors();
      draw();
    };

    const draw = () => {
      const width = cols * CELL;
      const height = rows * CELL;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${FONT_SIZE}px 'JetBrains Mono Variable', ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let c = 0; c < cols; c++) {
        const x = c * CELL + CELL / 2;
        for (let r = 0; r < rows; r++) {
          const i = c * rows + r;
          const l = life[i] ?? 0;
          ctx.globalAlpha = 0.28 + l * 0.72;
          ctx.fillStyle = l > 0.85 ? colors.hot : colors.bit;
          ctx.fillText(chars[i] ?? '0', x, r * CELL + CELL / 2);
        }
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      for (let i = 0; i < life.length; i++) {
        const l = life[i] ?? 0;
        if (l > 0) life[i] = l < 0.02 ? 0 : l * 0.9;
      }
      for (let c = 0; c < cols; c++) {
        const drop = drops[c];
        if (!drop) {
          if (Math.random() < 0.004) drops[c] = newDrop();
          continue;
        }
        drop.y += drop.speed;
        const r = Math.floor(drop.y);
        if (r >= 0 && r < rows) {
          const i = c * rows + r;
          life[i] = 1;
          chars[i] = bit();
        }
        if (r > rows + 8) drops[c] = newDrop();
      }
      // Quelques bits basculent au hasard.
      for (let k = 0; k < 6; k++) {
        const i = Math.floor(Math.random() * chars.length);
        chars[i] = bit();
      }
    };

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || t - last < 1000 / FPS) return;
      last = t;
      step();
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      readColors();
      draw();
    };
    scheme.addEventListener('change', onScheme);

    let io: IntersectionObserver | undefined;
    if (!reduced) {
      io = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting) && !document.hidden;
      });
      io.observe(canvas);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io?.disconnect();
      scheme.removeEventListener('change', onScheme);
    };
  }, [density]);

  return <canvas ref={ref} className="binary-field" aria-hidden="true" />;
}
