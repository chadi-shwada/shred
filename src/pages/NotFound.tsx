import { href } from '../router';

export function NotFound() {
  return (
    <div className="container page-head page-body">
      <span className="eyebrow">Erreur 404</span>
      <h1>Cette page n'existe pas</h1>
      <p className="lead">Le lien est peut-être incomplet.</p>
      <a className="btn btn--primary" href={href('/')}>
        Retour à l'accueil
      </a>
    </div>
  );
}
