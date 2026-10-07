import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AUTHOR, SOURCE_CODE_URL } from '../config';
import { href, type RoutePath } from '../router';
import { ExternalLink } from './ExternalLink';
import { FooterWord } from './FooterWord';
import { Icon } from './Icon';
import { Logo } from './Logo';

const NAV: { path: RoutePath; label: string }[] = [
  { path: '/verifier', label: 'Vérifier' },
  { path: '/lettre', label: 'Écrire une lettre' },
  { path: '/suivi', label: 'Suivi' },
  { path: '/que-faire', label: 'Que faire ?' },
  { path: '/ressources', label: 'Ressources' },
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

  // Barre de navigation détachée et arrondie dès que la page défile.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const skipToContent = (event: MouseEvent) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#contenu" onClick={skipToContent}>
        Aller au contenu
      </a>
      <header className="site-header theme-dark" data-scrolled={scrolled}>
        <div className="container site-header__inner">
          <a className="brand" href={href('/')} aria-label="ShredRGPD, outil français, accueil">
            <Logo />
            <span className="brand__flag" aria-hidden="true" title="Fait en France" />
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
          <a className="btn btn--primary btn--sm header-cta" href={href('/lettre')}>
            Écrire ma lettre
          </a>
        </div>
      </header>

      <main id="contenu" ref={mainRef} tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer theme-dark">
        <div className="container">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <a className="brand" href={href('/')} aria-label="ShredRGPD, accueil">
                <Logo />
              </a>
              <p>
                Outil gratuit pour exercer tes droits RGPD face aux sites qui exposent des données issues de fuites.
              </p>
            </div>
            <div className="site-footer__cols">
              <div>
                <h2>Outil</h2>
                <ul>
                  <li>
                    <a href={href('/verifier')}>Vérifier mes fuites</a>
                  </li>
                  <li>
                    <a href={href('/lettre')}>Écrire une lettre</a>
                  </li>
                  <li>
                    <a href={href('/suivi')}>Suivi</a>
                  </li>
                  <li>
                    <a href="/fuites.xml" type="application/atom+xml">
                      Nouvelles fuites (flux RSS)
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2>Comprendre</h2>
                <ul>
                  <li>
                    <a href={href('/que-faire')}>Que faire ?</a>
                  </li>
                  <li>
                    <a href={href('/ressources')}>Ressources</a>
                  </li>
                  <li>
                    <a href={href('/a-propos')}>À propos</a>
                  </li>
                  <li>
                    <a href={href('/mentions-legales')}>Mentions légales</a>
                  </li>
                  <li>
                    <ExternalLink href={AUTHOR.url}>Une erreur, une idée ? Écris-moi</ExternalLink>
                  </li>
                  {SOURCE_CODE_URL && (
                    <li>
                      <a href={SOURCE_CODE_URL} rel="noopener noreferrer">
                        Code source
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="site-footer__legal">
            <span>Modèles indicatifs, pas un conseil juridique.</span>
            <span>
              Conçu avec ❤️ par <ExternalLink href={AUTHOR.url}>{AUTHOR.name}</ExternalLink> et l'IA · © 2026
            </span>
            <span>Ce que tu saisis reste dans ton navigateur.</span>
          </div>
        </div>
        <FooterWord />
      </footer>
    </>
  );
}
