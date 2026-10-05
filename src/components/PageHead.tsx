import type { ReactNode } from 'react';
import { BinaryField } from './BinaryField';

interface PageHeadProps {
  eyebrow: string;
  title: string;
  /** Ligne de commande décorative affichée à droite (grands écrans). */
  command?: { input: string; output: string };
  children?: ReactNode;
}

/** En-tête de page sombre avec champ binaire discret. */
export function PageHead({ eyebrow, title, command, children }: PageHeadProps) {
  return (
    <div className="page-head hero theme-dark">
      <BinaryField density={0.15} />
      <div className="hero__veil" />
      <div className="container page-head__grid">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {children && <p className="lead">{children}</p>}
        </div>
        {command && (
          <div className="page-head__cmd" aria-hidden="true">
            <div className="terminal__bar">
              <span className="terminal__dot" />
              <span className="terminal__dot" />
              <span className="terminal__dot" />
            </div>
            <p>
              <b>$</b> {command.input}
              <span className="terminal__cursor" />
            </p>
            <p className="page-head__out">› {command.output}</p>
          </div>
        )}
      </div>
    </div>
  );
}
