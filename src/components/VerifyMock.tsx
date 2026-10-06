import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

/**
 * Aperçu animé de la page Vérifier (décoratif) : frappe de la recherche,
 * apparition des fuites, coches successives, compteur mis à jour, puis bouton
 * « Écrire la lettre » mis en avant.
 * Les fuites sont réelles : ce sont les trois premiers résultats de la recherche
 * « mobile » dans le catalogue Have I Been Pwned (vérifié le 6 octobre 2026),
 * avec leurs types de données traduits comme sur la page Vérifier.
 * Ne tourne que lorsqu'il est visible ; état final fixe si prefers-reduced-motion.
 */

const BREACHES = [
  {
    title: 'Free',
    domain: 'free.fr',
    date: 'oct. 2024',
    classes: [
      'numéros de compte bancaire',
      'dates de naissance',
      'genre',
      'noms',
      'numéros de téléphone',
      'adresses postales',
    ],
  },
  {
    title: 'La Poste Mobile',
    domain: 'lapostemobile.fr',
    date: 'juil. 2022',
    classes: [
      'numéros de compte bancaire',
      'dates de naissance',
      'adresses e-mail',
      'genre',
      'noms',
      'numéros de téléphone',
      'adresses postales',
    ],
  },
  {
    title: 'ActMobile',
    domain: 'actmobile.com',
    date: 'oct. 2021',
    classes: ['adresses e-mail', 'adresses IP'],
  },
];

/** Nombre de types affichés par fuite, comme sur la page Vérifier ; les autres sont résumés en « +N ». */
const SHOWN = 3;

const QUERY = 'mobile';
const RISKY = new Set(['mots de passe', 'numéros de compte bancaire']);

interface Frame {
  query: string;
  rows: number;
  selected: number;
  cta: boolean;
}

const START: Frame = { query: '', rows: 0, selected: 0, cta: false };
const END: Frame = { query: QUERY, rows: BREACHES.length, selected: 2, cta: true };

/** Chronologie : [instant en ms, modification de l'état]. */
function timeline(): [number, Partial<Frame>][] {
  const steps: [number, Partial<Frame>][] = [[0, START]];
  for (let i = 1; i <= QUERY.length; i++) steps.push([400 + i * 110, { query: QUERY.slice(0, i) }]);
  steps.push([1350, { rows: 1 }], [1500, { rows: 2 }], [1650, { rows: 3 }]);
  steps.push([2600, { selected: 1 }], [3600, { selected: 2 }], [4400, { cta: true }]);
  return steps;
}

const LOOP_MS = 7800;

/** Nombre de types de données distincts parmi les fuites cochées. */
export function exposedCount(selected: number): number {
  return new Set(BREACHES.slice(0, selected).flatMap((b) => b.classes)).size;
}

function footerText(selected: number): string {
  if (selected === 0) return 'Coche les fuites trouvées';
  const types = exposedCount(selected);
  return `${selected} fuite${selected > 1 ? 's' : ''} · ${types} types de données exposés`;
}

export function VerifyMock() {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [frame, setFrame] = useState<Frame>(reduced ? END : START);

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    let timers: number[] = [];
    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const play = () => {
      clear();
      for (const [at, change] of timeline()) {
        timers.push(window.setTimeout(() => setFrame((f) => ({ ...f, ...change })), at));
      }
      timers.push(window.setTimeout(play, LOOP_MS));
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else clear();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clear();
    };
  }, [reduced]);

  return (
    <div className="mock" aria-hidden="true" ref={ref}>
      <div className="mock__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="mock__url">shred / vérifier</span>
      </div>
      <div className="mock__body">
        <div className="mock__search" data-active={frame.query.length > 0}>
          <Icon name="search" size={16} />
          <span>{frame.query || <span className="mock__placeholder">Nom de la fuite ou du site</span>}</span>
          {!frame.cta && <span className="terminal__cursor" />}
        </div>
        {BREACHES.map((b, i) => (
          <div className="mock__row" key={b.title} data-visible={i < frame.rows} data-selected={i < frame.selected}>
            <span className="mock__check">{i < frame.selected && <Icon name="check" size={12} />}</span>
            <div>
              <strong>{b.title}</strong>
              <span className="mock__meta">
                {b.domain} · {b.date}
              </span>
              <span className="mock__chips">
                {b.classes.slice(0, SHOWN).map((c) => (
                  <span key={c} className={`chip${RISKY.has(c) ? ' chip--danger' : ''}`}>
                    {c}
                  </span>
                ))}
                {b.classes.length > SHOWN && <span className="chip">+{b.classes.length - SHOWN}</span>}
              </span>
            </div>
          </div>
        ))}
        <div className="mock__footer">
          <span>{footerText(frame.selected)}</span>
          <span className="mock__cta" data-active={frame.cta}>
            Écrire la lettre <Icon name="arrow" size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
