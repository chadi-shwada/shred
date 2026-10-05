import type { ReactNode } from 'react';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Lien sortant, sans référent ni accès à la fenêtre d'origine. */
export function ExternalLink({ href, children, className, title }: ExternalLinkProps) {
  return (
    <a href={href} className={className} title={title} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (nouvel onglet)</span>
    </a>
  );
}
