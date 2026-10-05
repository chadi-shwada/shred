import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { loadBreachCatalog } from '../breachCatalog';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import {
  dataClassLabel,
  HIBP_LICENSE_URL,
  HIBP_URL,
  recentFrenchBreaches,
  searchBreaches,
  type Breach,
  type BreachCatalog,
} from '../lib/breaches';
import { formatLongFr } from '../lib/dates';
import { breachLetterQuery } from '../lib/letterLink';
import { pwnedCount, PwnedServiceError } from '../lib/pwned';
import { href } from '../router';

const RISKY = new Set(['Passwords', 'Credit cards', 'Partial credit card data', 'Bank account numbers']);

const ADVICE: { when: string[]; text: string }[] = [
  {
    when: ['Passwords', 'Password hints'],
    text: "Change le mot de passe concerné partout où tu l'utilises, et active la double authentification.",
  },
  {
    when: ['Credit cards', 'Partial credit card data', 'Bank account numbers'],
    text: 'Préviens ta banque et surveille tes relevés.',
  },
  {
    when: ['Phone numbers'],
    text: 'Méfie-toi des SMS et appels qui citent tes informations : la fuite sert souvent au hameçonnage.',
  },
  {
    when: ['Email addresses'],
    text: "Attends-toi à des e-mails d'hameçonnage crédibles. Ne clique pas sur les liens inattendus.",
  },
  {
    when: ['Government issued IDs', 'Passport numbers', 'Social security numbers'],
    text: "Tes papiers d'identité peuvent servir à une usurpation : signale-le sur cybermalveillance.gouv.fr.",
  },
];

function formatCount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

type PwnedState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; count: number }
  | { status: 'clean' }
  | { status: 'error'; message: string };

function PasswordCheck() {
  const id = useId();
  const [password, setPassword] = useState('');
  const [state, setState] = useState<PwnedState>({ status: 'idle' });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setState({ status: 'loading' });
    try {
      const count = await pwnedCount(password, (url, init) => fetch(url, init));
      setState(count > 0 ? { status: 'found', count } : { status: 'clean' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof PwnedServiceError ? error.message : "Le test n'a pas pu aboutir. Réessaie plus tard.",
      });
    } finally {
      // On ne garde pas le mot de passe en mémoire plus que nécessaire.
      setPassword('');
    }
  };

  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <h2 className="card__title" id={`${id}-title`}>
        <span className="card__num">
          <Icon name="lock" size={14} />
        </span>
        Teste un mot de passe
      </h2>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${id}-pw`}>Mot de passe</label>
          <input
            id={`${id}-pw`}
            className="input input--mono"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-how`}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={!password || state.status === 'loading'}>
          <Icon name="search" size={18} />
          {state.status === 'loading' ? 'Test en cours…' : 'Tester'}
        </button>
      </form>

      <div aria-live="polite" className="verify__result">
        {state.status === 'found' && (
          <Notice tone="danger">
            <p>
              <strong>Ce mot de passe apparaît {formatCount(state.count)} fois dans des fuites connues.</strong>
            </p>
            <p>Ne l'utilise plus nulle part et remplace-le partout où il sert encore.</p>
          </Notice>
        )}
        {state.status === 'clean' && (
          <Notice tone="ok">
            <p>
              <strong>Aucune occurrence connue.</strong> Ça ne prouve pas qu'il est solide : garde-le unique et long.
            </p>
          </Notice>
        )}
        {state.status === 'error' && (
          <Notice tone="warn">
            <p>{state.message}</p>
          </Notice>
        )}
      </div>

      <p className="hint verify__how" id={`${id}-how`}>
        Shred calcule l'empreinte SHA-1 dans ton navigateur et n'envoie que ses 5 premiers caractères à{' '}
        <ExternalLink href="https://haveibeenpwned.com/Passwords">Pwned Passwords</ExternalLink>. Le service renvoie des
        centaines d'empreintes qui commencent pareil, et la comparaison se fait chez toi. Ton mot de passe ne quitte
        jamais ton appareil.
      </p>
    </section>
  );
}

function BreachRow({ breach, selected, onToggle }: { breach: Breach; selected: boolean; onToggle: () => void }) {
  const shown = breach.dataClasses.slice(0, 4);
  const more = breach.dataClasses.length - shown.length;
  return (
    <li>
      <label className="breach" data-selected={selected}>
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span className="breach__main">
          <span className="breach__title">
            {breach.title}
            {!breach.verified && <span className="breach__flag">non vérifiée</span>}
            {breach.fabricated && <span className="breach__flag">possiblement fabriquée</span>}
            {breach.spamList && <span className="breach__flag">liste de spam</span>}
          </span>
          <span className="breach__meta">
            {breach.domain && <span className="mono">{breach.domain}</span>}
            <span>{formatLongFr(breach.date)}</span>
            {breach.pwnCount > 0 && <span>{formatCount(breach.pwnCount)} comptes</span>}
          </span>
          <span className="breach__classes">
            {shown.map((dc) => (
              <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                {dataClassLabel(dc)}
              </span>
            ))}
            {more > 0 && <span className="chip">+{more}</span>}
          </span>
        </span>
      </label>
    </li>
  );
}

export function Verify() {
  const id = useId();
  const [catalog, setCatalog] = useState<BreachCatalog | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    loadBreachCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sans recherche : les fuites françaises récentes (repli sur toutes si aucune n'est repérée).
  const frenchRecent = useMemo(() => (catalog ? recentFrenchBreaches(catalog.breaches, 12) : []), [catalog]);
  const showFrench = !query && frenchRecent.length > 0;
  const results = useMemo(() => {
    if (!catalog) return [];
    if (!query && frenchRecent.length > 0) return frenchRecent;
    return searchBreaches(catalog.breaches, query, 12);
  }, [catalog, query, frenchRecent]);
  const chosen = useMemo(
    () => (catalog ? catalog.breaches.filter((b) => selected.includes(b.name)) : []),
    [catalog, selected],
  );
  const exposed = useMemo(() => [...new Set(chosen.flatMap((b) => b.dataClasses))], [chosen]);
  const advice = ADVICE.filter((a) => a.when.some((w) => exposed.includes(w)));

  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const unavailable = catalog !== null && catalog.breaches.length === 0;

  return (
    <>
      <PageHead
        eyebrow="Vérifier"
        command={{ input: 'shred verifier --email ••••••', output: 'aucune donnée envoyée à Shred' }}
        title="Qu'est-ce qui a fuité ?"
      >
        Repère les fuites qui te concernent, vois quelles données sont exposées, puis écris à l'entreprise en un clic.
        Ton adresse e-mail ne passe jamais par Shred.
      </PageHead>

      <div className="container page-body">
        <div className="verify">
          <div className="verify__main">
            <section className="card" aria-labelledby={`${id}-s1`}>
              <h2 className="card__title" id={`${id}-s1`}>
                <span className="card__num">1</span>
                Cherche ton adresse e-mail
              </h2>
              <p className="muted">
                Have I Been Pwned, le service de référence, liste les fuites qui contiennent ton adresse. Fais la
                recherche sur leur site, puis reviens ici avec les noms des fuites trouvées.
              </p>
              <ExternalLink href={HIBP_URL} className="btn btn--primary">
                Ouvrir Have I Been Pwned
                <Icon name="external" size={16} />
              </ExternalLink>
            </section>

            <section className="card" aria-labelledby={`${id}-s2`}>
              <h2 className="card__title" id={`${id}-s2`}>
                <span className="card__num">2</span>
                Coche les fuites trouvées
              </h2>

              {catalog === null && <p className="muted">Chargement de la liste des fuites…</p>}

              {unavailable && (
                <Notice tone="warn">
                  <p>La liste des fuites n'est pas disponible dans cette version du site.</p>
                  <p>
                    Tu peux quand même écrire ta lettre :{' '}
                    <a href={href('/lettre', { contexte: 'violation' })}>choisis « Une entreprise a subi une fuite »</a>
                    .
                  </p>
                </Notice>
              )}

              {catalog && catalog.breaches.length > 0 && (
                <>
                  <div className="field">
                    <label htmlFor={`${id}-q`}>Nom de la fuite ou du site</label>
                    <input
                      id={`${id}-q`}
                      className="input"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ex. le nom affiché par Have I Been Pwned"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <p className="hint" aria-live="polite">
                    {query
                      ? `${results.length} résultat${results.length > 1 ? 's' : ''}`
                      : showFrench
                        ? 'Les fuites récentes en France. Cherche ci-dessus pour voir toutes les autres, y compris les services étrangers.'
                        : 'Les fuites les plus récentes :'}
                  </p>
                  <ul className="breach-list">
                    {results.map((b) => (
                      <BreachRow
                        key={b.name}
                        breach={b}
                        selected={selected.includes(b.name)}
                        onToggle={() => toggle(b.name)}
                      />
                    ))}
                  </ul>
                  <p className="hint verify__credit">
                    Liste des fuites : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
                    <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
                    {catalog.fetchedOn && <>, mise à jour le {formatLongFr(catalog.fetchedOn)}</>}. Ce sont des
                    informations publiques sur les fuites, pas les données fuitées.
                  </p>
                </>
              )}
            </section>

            {chosen.length > 0 && (
              <section className="card" aria-labelledby={`${id}-s3`}>
                <h2 className="card__title" id={`${id}-s3`}>
                  <span className="card__num">3</span>
                  Ce qui a fuité, et quoi faire
                </h2>
                <div className="chips verify__exposed">
                  {exposed.map((dc) => (
                    <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                      {dataClassLabel(dc)}
                    </span>
                  ))}
                </div>

                {advice.length > 0 && (
                  <ul className="checklist">
                    {advice.map((a) => (
                      <li key={a.text}>
                        <Icon name="alert" size={18} />
                        {a.text}
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="letter-targets">
                  {chosen.map((b) => (
                    <li key={b.name}>
                      <div>
                        <strong>{b.title}</strong>
                        <span className="hint">Fuite du {formatLongFr(b.date)}</span>
                      </div>
                      <div className="btn-row">
                        <a className="btn btn--primary btn--sm" href={href('/lettre', breachLetterQuery(b, 'acces'))}>
                          Demander ce qui a fuité
                        </a>
                        <a className="btn btn--sm" href={href('/lettre', breachLetterQuery(b, 'effacement'))}>
                          Demander l'effacement
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="hint">
                  « Demander ce qui a fuité » s'appuie sur les articles 15 et 34 du RGPD : l'entreprise doit te dire
                  quelles données te concernent et ce qu'elle a fait. Les lettres sont des modèles indicatifs.
                </p>
              </section>
            )}
          </div>

          <aside className="verify__side">
            <PasswordCheck />
          </aside>
        </div>
      </div>
    </>
  );
}
