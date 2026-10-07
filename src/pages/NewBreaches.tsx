import summary from 'virtual:catalog-summary';
import { useState } from 'react';
import { copyText } from '../browser';
import { BreachMark } from '../components/BreachMark';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/PageHead';
import { SITE_URL } from '../config';
import { formatMonthFr } from '../lib/breachPages';
import { href } from '../router';

/** Adresse du flux Atom des fuites françaises, généré au build (vite.config.ts). */
const FEED_PATH = '/fuites.xml';
const FEED_URL = SITE_URL + FEED_PATH;

const READERS = [
  { name: 'Feedly', url: 'https://feedly.com', text: 'dans le navigateur et sur mobile' },
  { name: 'Inoreader', url: 'https://www.inoreader.com', text: 'dans le navigateur et sur mobile' },
  { name: 'NetNewsWire', url: 'https://netnewswire.com', text: 'application libre pour Mac et iPhone' },
  { name: 'Thunderbird', url: 'https://www.thunderbird.net', text: 'messagerie libre, qui lit aussi les flux' },
];

export function NewBreaches() {
  const [copied, setCopied] = useState<'ok' | 'ko' | null>(null);

  const onCopy = async () => setCopied((await copyText(FEED_URL)) ? 'ok' : 'ko');

  return (
    <>
      <PageHead
        eyebrow="Nouvelles fuites"
        command={{ input: 'shredrgpd suivre --fuites', output: 'flux Atom · sans compte' }}
        title="Suis les nouvelles fuites en France"
      >
        Chaque fuite française ajoutée au catalogue Have I Been Pwned arrive dans ton lecteur de flux. Sans compte, sans
        e-mail : ShredRGPD ne sait pas qui le suit.
      </PageHead>

      <div className="container page-body">
        <div className="content-grid">
          <div className="prose">
            <h2>S'abonner en deux gestes</h2>
            <ol>
              <li>Copie l'adresse du flux ci-dessous.</li>
              <li>Colle-la dans ton lecteur de flux, à l'endroit prévu pour ajouter un abonnement.</li>
            </ol>
            <div className="feed-url">
              <label htmlFor="feed-url">Adresse du flux</label>
              <div className="feed-url__row">
                <input id="feed-url" className="input" value={FEED_URL} readOnly onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn--primary" onClick={onCopy}>
                  <Icon name={copied === 'ok' ? 'check' : 'copy'} size={18} />
                  {copied === 'ok' ? 'Copiée' : 'Copier'}
                </button>
              </div>
              <p className="hint" role="status">
                {copied === 'ko' && 'La copie a échoué : sélectionne l’adresse et copie-la à la main.'}
              </p>
            </div>

            <h2>Pas encore de lecteur de flux ?</h2>
            <p>
              Un lecteur de flux rassemble les nouveautés des sites que tu suis, sans algorithme ni publicité. Quelques
              lecteurs gratuits :
            </p>
            <ul>
              {READERS.map((r) => (
                <li key={r.name}>
                  <ExternalLink href={r.url}>{r.name}</ExternalLink> : {r.text}.
                </li>
              ))}
            </ul>
            <p className="small">
              Ces services n'ont aucun lien avec ShredRGPD. Le lecteur que tu choisis voit que tu suis ce flux, comme
              n'importe quel abonnement.
            </p>

            <h2>Sans lecteur de flux</h2>
            <p>
              Sur la page <a href={href('/verifier')}>Vérifier</a>, à l'étape où tu coches tes fuites, le bouton « Me
              signaler les nouvelles fuites » garde la date de ta visite dans ton navigateur. À ton retour, ShredRGPD te
              montre les fuites françaises ajoutées depuis.
            </p>
            <p className="small">
              Tu cherches le fichier lui-même ? <a href={FEED_PATH}>fuites.xml</a> (format Atom, fait pour les lecteurs
              de flux : ton navigateur l'affiche en code brut).
            </p>
          </div>

          {summary.latest.length > 0 && (
            <aside className="breach-page__side" aria-labelledby="dernieres">
              <h2 id="dernieres">Ce que contient le flux</h2>
              <p className="small muted">Les dernières fuites françaises :</p>
              <ul className="breach-links">
                {summary.latest.map((b) => (
                  <li key={b.path}>
                    <span className="breach-links__name">
                      <BreachMark title={b.title} name={b.name} size="sm" />
                      <a href={b.path}>{b.title}</a>
                    </span>
                    <span className="hint">{formatMonthFr(b.date)}</span>
                  </li>
                ))}
              </ul>
              <p className="small">
                <a href={href('/chiffres')}>Toutes les fuites, en chiffres</a>
              </p>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
