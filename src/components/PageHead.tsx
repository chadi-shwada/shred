import type { ReactNode } from 'react';
import { BinaryField } from './BinaryField';

interface PageHeadProps {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}

/** En-tête de page sombre avec champ binaire discret. */
export function PageHead({ eyebrow, title, children }: PageHeadProps) {
  return (
    <div className="page-head hero theme-dark">
      <BinaryField density={0.15} />
      <div className="hero__veil" />
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
    </div>
  );
}
