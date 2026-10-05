import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { href, type RoutePath } from '../router';
import { Icon } from './Icon';
import { Logo } from './Logo';

const NAV: { path: RoutePath; label: string }[] = [
  { path: '/lettre', label: 'Écrire une lettre' },
  { path: '/suivi', label: 'Suivi' },
  { path: '/ressources', label: 'Ressources' },
  { path: '/a-propos', label: 'À propos' },
];

interface LayoutProps {
  path: string;
  children: ReactNode;
}

export function Layout({ path, children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Ferme le menu mobile à chaque changement de page.
  const [lastPath, setLastPath] = useState(path);
  if (lastPath !== path) {
    setLastPath(path);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const skipToContent = (event: MouseEvent) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#contenu" onClick={skipToContent}>
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href={href('/')} aria-label="Shred, accueil">
            <Logo />
          </a>
          <button
            type="button"
            className="btn btn--ghost btn--sm nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
            <span>Menu</span>
          </button>
          <nav id="navigation" className="nav-wrap" data-open={menuOpen} aria-label="Navigation principale">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.path}>
                  <a href={href(item.path)} aria-current={path === item.path ? 'page' : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" ref={mainRef} tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <p>
              <strong>Shred</strong> est un outil libre et gratuit. Les modèles de lettres sont indicatifs et ne
              remplacent pas un conseil juridique.
            </p>
            <p>Aucune donnée ne quitte ton navigateur : pas de compte, pas de serveur, pas de traceur.</p>
          </div>
          <ul>
            <li>
              <a href={href('/ressources')}>Ressources</a>
            </li>
            <li>
              <a href={href('/a-propos')}>À propos</a>
            </li>
            <li>
              <a href="https://github.com/chadi-shwada/shred" rel="noopener noreferrer">
                Code source
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
