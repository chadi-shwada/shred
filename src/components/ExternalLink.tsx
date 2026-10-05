import type { ReactNode } from 'react';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** Lien sortant, sans référent ni accès à la fenêtre d'origine. */
export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (nouvel onglet)</span>
    </a>
  );
}
