import type { CSSProperties } from 'react';
import { Icon } from './Icon';

/**
 * Animation d'accueil (décorative) : une fiche de fuite est analysée,
 * découpée en bandes comme le logo, puis remplacée par la confirmation.
 * Respecte prefers-reduced-motion (voir global.css).
 */

const SLICES = 12;
const WIDTH = 100 / SLICES;

function LeakCard() {
  return (
    <div className="terminal">
      <div className="terminal__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__title">exemple-fuites.test/dump/2026</span>
      </div>
      <div className="terminal__body">
        <span className="terminal__alert">Fuite détectée · 4 champs exposés</span>
        <dl className="terminal__rows">
          <div className="terminal__row">
            <dt>email</dt>
            <dd>c•••••.m•••••@mail.test</dd>
          </div>
          <div className="terminal__row">
            <dt>password</dt>
            <dd className="hl">5f4dcc3b5aa765d61d83…</dd>
          </div>
          <div className="terminal__row">
            <dt>phone</dt>
            <dd>+33 6 •• •• •• 12</dd>
          </div>
          <div className="terminal__row">
            <dt>address</dt>
            <dd>12 rue ••••••, 75011</dd>
          </div>
        </dl>
        <p className="terminal__prompt">
          <b>$</b> shred --effacer --rgpd art.17
          <span className="terminal__cursor" />
        </p>
        <p className="terminal__hex">
          0x53 0x68 0x72 0x65 0x64 0x00 0x6c 0x65 0x61 0x6b 0x00 0x64 0x61 0x74 0x61 0x3a 0x01 0x00
        </p>
      </div>
    </div>
  );
}

export function ShredSheet() {
  return (
    <div className="shred" aria-hidden="true">
      <div className="shred__stage">
        <div className="shred__done">
          <span className="shred__check">
            <Icon name="check" size={28} />
          </span>
          <div>
            <strong>Demande d'effacement envoyée</strong>
            <span>art. 17 RGPD · réponse sous un mois</span>
          </div>
        </div>
        {Array.from({ length: SLICES }, (_, i) => (
          <div
            key={i}
            className="shred__slice"
            style={
              {
                clipPath: `inset(0 ${100 - (i + 1) * WIDTH}% 0 ${i * WIDTH}%)`,
                '--i': i,
                '--r': `${(i % 2 === 0 ? 1 : -1) * (1 + (i % 3))}deg`,
              } as CSSProperties
            }
          >
            <LeakCard />
          </div>
        ))}
        <span className="shred__scan" />
      </div>
      <div className="shred__bits">
        {Array.from({ length: SLICES }, (_, i) => (
          <span key={i}>{((i * 2654435761) >>> 0).toString(2).padStart(10, '1').slice(0, 10)}</span>
        ))}
      </div>
    </div>
  );
}
