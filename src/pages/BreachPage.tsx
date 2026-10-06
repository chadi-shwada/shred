import { useEffect, useState } from 'react';
import { ActionPlan } from '../components/ActionPlan';
import { BreachMark } from '../components/BreachMark';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/PageHead';
import { loadBreachCatalog } from '../breachCatalog';
import { DPO_CONTACTS } from '../data/contacts';
import { breachPageMeta, breachPathsByName, findBreachBySlug, formatMonthFr, pageBreaches } from '../lib/breachPages';
import {
  dataClassLabel,
  formatCount,
  HIBP_LICENSE_URL,
  HIBP_URL,
  hibpBreachUrl,
  RISKY_DATA_CLASSES,
  type BreachCatalog,
} from '../lib/breaches';
import { formatLongFr } from '../lib/dates';
import { breachLetterQuery } from '../lib/letterLink';
import { breachRisk, RISK_LABELS, RISK_RULE } from '../lib/risk';
import { href } from '../router';
import { NOT_FOUND } from '../seo';
import { NotFound } from './NotFound';

/** Nombre d'autres fuites proposées en bas de page. */
const OTHERS = 6;

/**
 * Page publique d'une fuite française (/fuite/free…) : ce qui a fuité, comment
 * savoir si on est concerné, quoi faire, et la lettre pré-remplie.
 * Métadonnées publiques du catalogue HIBP seulement (règle n° 2).
 */
export function BreachPage({ slug }: { slug: string }) {
  const [catalog, setCatalog] = useState<BreachCatalog | null>(null);

  useEffect(() => {
    let active = true;
    loadBreachCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  const breach = catalog ? findBreachBySlug(catalog.breaches, slug) : null;

  useEffect(() => {
    if (breach) document.title = breachPageMeta(breach, slug).title;
    else if (catalog) document.title = NOT_FOUND.title;
  }, [breach, catalog, slug]);

  if (!catalog) {
    return (
      <PageHead eyebrow="Fuite de données" title="Chargement…">
        Lecture du catalogue des fuites.
      </PageHead>
    );
  }
  if (!breach) return <NotFound />;

  const paths = breachPathsByName(catalog.breaches);
  const others = pageBreaches(catalog.breaches)
    .filter((b) => b.name !== breach.name)
    .slice(0, OTHERS);
  const contact = DPO_CONTACTS[breach.name];
  const risk = breachRisk(breach.dataClasses);
  const facts = [
    { label: 'Date de la fuite', value: formatLongFr(breach.date) },
    ...(breach.pwnCount > 0 ? [{ label: 'Comptes touchés', value: formatCount(breach.pwnCount) }] : []),
    { label: 'Types de données', value: String(breach.dataClasses.length) },
    ...(breach.addedDate ? [{ label: 'Connue de HIBP depuis le', value: formatLongFr(breach.addedDate) }] : []),
  ];

  return (
    <>
      <PageHead
        eyebrow="Fuite de données"
        command={{ input: `shred fuite ${slug}`, output: `${breach.dataClasses.length} types de données exposés` }}
        title={`Fuite ${breach.title}`}
      >
        {breach.domain ? `${breach.title} (${breach.domain})` : breach.title} a subi une fuite de données le{' '}
        {formatLongFr(breach.date)}. Voici ce qui a fuité, comment savoir si tu es concerné, et quoi faire.
      </PageHead>

      <div className="container page-body breach-page">
        <div className="breach-summary">
          <BreachMark title={breach.title} size="lg" />
          <div>
            <span className={`risk risk--${risk}`}>{RISK_LABELS[risk]}</span>
            <p className="hint">{RISK_RULE}</p>
          </div>
        </div>
        <dl className="breach-facts">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="content-grid">
          <div className="prose">
            <h2>Ce qui a fuité</h2>
            <div className="chips">
              {breach.dataClasses.map((dc) => (
                <span key={dc} className={`chip${RISKY_DATA_CLASSES.has(dc) ? ' chip--danger' : ''}`}>
                  {dataClassLabel(dc)}
                </span>
              ))}
            </div>
            {!breach.verified && (
              <p className="hint">Have I Been Pwned n'a pas pu confirmer cette fuite auprès de l'entreprise.</p>
            )}

            <h2>Es-tu concerné ?</h2>
            <p>
              Cherche ton adresse e-mail sur Have I Been Pwned : si elle apparaît dans la fuite {breach.title}, tes
              données en font partie. Ton e-mail ne passe jamais par Shred.
            </p>
            <p className="btn-row">
              <ExternalLink href={HIBP_URL} className="btn btn--primary">
                Chercher mon e-mail
              </ExternalLink>
              <ExternalLink href={hibpBreachUrl(breach)} className="btn">
                Fiche de la fuite sur HIBP
              </ExternalLink>
            </p>

            <h2>Que faire maintenant ?</h2>
            <ActionPlan dataClasses={breach.dataClasses} />
            <p>
              Un message qui cite la fuite, un appel « de ta banque » ? Vois les bons réflexes sur{' '}
              <a href={href('/que-faire')}>Que faire ?</a>.
            </p>

            <h2>Écris à {breach.title}</h2>
            <p>
              Le RGPD te permet de demander à l'entreprise ce qu'elle détient sur toi et ce qui a fuité (articles 15 et
              34), ou d'effacer tes données (article 17). Elle a un mois pour te répondre (article 12.3).
            </p>
            <p className="btn-row">
              <a className="btn btn--primary" href={href('/lettre', breachLetterQuery(breach, 'acces'))}>
                Demander ce qui a fuité
                <Icon name="arrow" size={18} />
              </a>
              <a className="btn" href={href('/lettre', breachLetterQuery(breach, 'effacement'))}>
                Demander l'effacement
              </a>
            </p>
            <p className="hint">
              {contact ? (
                <>
                  Contact protection des données :{' '}
                  {contact.kind === 'email' ? (
                    contact.contact
                  ) : (
                    <ExternalLink href={contact.contact}>formulaire</ExternalLink>
                  )}{' '}
                  (<ExternalLink href={contact.source}>source</ExternalLink>, vérifié le{' '}
                  {formatLongFr(contact.verifiedOn)}).
                </>
              ) : (
                <>
                  Le contact du délégué à la protection des données (DPO) figure en général dans la politique de
                  confidentialité{breach.domain ? ` de ${breach.domain}` : ''}. Les lettres sont des modèles indicatifs,
                  pas un conseil juridique.
                </>
              )}
            </p>

            <p className="hint verify__credit">
              Informations : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
              <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
              {catalog.fetchedOn && <>, mise à jour le {formatLongFr(catalog.fetchedOn)}</>}. Ce sont des informations
              publiques sur la fuite, pas les données fuitées.
            </p>
          </div>

          <aside className="breach-page__side" aria-labelledby="autres-fuites">
            <h2 id="autres-fuites">Autres fuites en France</h2>
            <ul className="breach-links">
              {others.map((b) => (
                <li key={b.name}>
                  <span className="breach-links__name">
                    <BreachMark title={b.title} size="sm" />
                    <a href={paths.get(b.name)}>{b.title}</a>
                  </span>
                  <span className="hint">{formatMonthFr(b.date)}</span>
                </li>
              ))}
            </ul>
            <p className="small">
              <a href="/fuites.xml">Suivre les nouvelles fuites (flux RSS)</a>
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
