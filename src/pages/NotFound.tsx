import { PageHead } from '../components/PageHead';
import { href } from '../router';

export function NotFound() {
  return (
    <>
      <PageHead
        eyebrow="Erreur 404"
        command={{ input: 'shred ouvrir --page', output: 'erreur 404 : introuvable' }}
        title="Cette page n'existe pas"
      >
        Le lien est peut-être incomplet. 01000100 01100101 01101100.
      </PageHead>
      <div className="container page-body">
        <a className="btn btn--primary" href={href('/')}>
          Retour à l'accueil
        </a>
      </div>
    </>
  );
}
