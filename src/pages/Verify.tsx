import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { loadBreachCatalog } from '../breachCatalog';
import { readStorage, writeStorage } from '../browser';
import { ActionPlan } from '../components/ActionPlan';
import { BatchLetters } from '../components/BatchLetters';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { PasteResults } from '../components/PasteResults';
import { breachPathsByName } from '../lib/breachPages';
import {
  dataClassLabel,
  formatCount,
  HIBP_LICENSE_URL,
  HIBP_URL,
  hibpBreachUrl,
  newFrenchBreachesSince,
  recentFrenchBreaches,
  RISKY_DATA_CLASSES,
  searchBreaches,
  type Breach,
  type BreachCatalog,
} from '../lib/breaches';
import { formatLongFr, isValidIsoDate, todayIso } from '../lib/dates';
import { breachLetterQuery } from '../lib/letterLink';
import { pwnedCount, PwnedServiceError } from '../lib/pwned';
import { href, navigate, useRoute } from '../router';

const LAST_VISIT_KEY = 'shred.verifier.derniereVisite';

/** Point de départ : comment la personne a appris la fuite (paramètre « parcours » du fragment). */
type Situation = 'verifier' | 'message' | 'publie';

const SITUATIONS: { value: Situation; label: string; hint: string }[] = [
  { value: 'verifier', label: 'Je veux savoir si je suis concerné', hint: 'recherche par e-mail' },
  { value: 'message', label: "Une entreprise m'a prévenu", hint: 'e-mail ou courrier reçu' },
  { value: 'publie', label: 'Mes données sont publiées', hint: 'sur un site ou un forum' },
];

function asSituation(value: string | null): Situation {
  return value === 'message' || value === 'publie' ? value : 'verifier';
}

/** Les outils de mot de passe sont repliés sur petit écran pour garder le parcours court. */
const WIDE_QUERY = '(min-width: 961px)';

const RISKY = RISKY_DATA_CLASSES;

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
  const shown = breach.dataClasses.slice(0, 3);
  const more = breach.dataClasses.length - shown.length;
  const meta = [
    breach.domain,
    formatLongFr(breach.date),
    breach.pwnCount > 0 ? `${formatCount(breach.pwnCount)} comptes` : '',
  ].filter(Boolean);
  return (
    <li className="breach" data-selected={selected}>
      <label className="breach__pick">
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span className="breach__main">
          <span className="breach__title">
            {breach.title}
            {!breach.verified && <span className="breach__flag">non vérifiée</span>}
            {breach.fabricated && <span className="breach__flag">possiblement fabriquée</span>}
            {breach.spamList && <span className="breach__flag">liste de spam</span>}
            {breach.malware && <span className="breach__flag">logiciel malveillant</span>}
          </span>
          <span className="breach__meta">{meta.join(' · ')}</span>
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
      <ExternalLink href={hibpBreachUrl(breach)} className="breach__more" title="Voir la fiche sur Have I Been Pwned">
        <Icon name="external" size={16} />
        <span className="visually-hidden">Fiche de {breach.title} sur Have I Been Pwned</span>
      </ExternalLink>
    </li>
  );
}

/** Nombre de fuites affichées avant « Afficher plus ». */
const FIRST_ROWS = 6;

export function Verify() {
  const id = useId();
  const route = useRoute();
  const situation = asSituation(route.query.get('parcours'));
  const setSituation = (value: Situation) =>
    navigate(href('/verifier', value === 'verifier' ? undefined : { parcours: value }), { replace: true });
  const [toolsOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(WIDE_QUERY).matches);
  const [catalog, setCatalog] = useState<BreachCatalog | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

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
  const breachPaths = useMemo(() => breachPathsByName(catalog?.breaches ?? []), [catalog]);

  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  const addMany = (names: string[]) => setSelected((s) => [...s, ...names.filter((n) => !s.includes(n))]);

  // Barre « voir quoi faire » sur mobile, tant que l'étape suivante est plus bas dans la page.
  const nextStep = useRef<HTMLElement>(null);
  const [nextVisible, setNextVisible] = useState(false);
  const hasChosen = chosen.length > 0;
  useEffect(() => {
    const target = nextStep.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      setNextVisible(entry ? entry.isIntersecting || entry.boundingClientRect.top < 0 : false),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasChosen]);
  const goToNextStep = () => {
    const target = nextStep.current;
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  };

  const unavailable = catalog !== null && catalog.breaches.length === 0;

  // Nouvelles fuites françaises depuis la dernière visite (date gardée dans le navigateur).
  const [lastVisit] = useState(() => {
    const raw = readStorage(LAST_VISIT_KEY);
    return raw && isValidIsoDate(raw) ? raw : null;
  });
  useEffect(() => {
    if (catalog && catalog.breaches.length > 0) writeStorage(LAST_VISIT_KEY, todayIso());
  }, [catalog]);
  const fresh = useMemo(
    () => (catalog ? newFrenchBreachesSince(catalog.breaches, lastVisit) : []),
    [catalog, lastVisit],
  );

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
        <fieldset className="situation">
          <legend className="situation__legend">Ta situation</legend>
          <div className="segmented">
            {SITUATIONS.map((s) => (
              <label key={s.value}>
                <input
                  type="radio"
                  name={`${id}-situation`}
                  value={s.value}
                  checked={situation === s.value}
                  onChange={() => setSituation(s.value)}
                />
                <strong>{s.label}</strong>
                <span>{s.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="verify">
          <div className="verify__main">
            {situation === 'publie' && (
              <section className="card" aria-labelledby={`${id}-pub`}>
                <h2 className="card__title" id={`${id}-pub`}>
                  <span className="card__num">1</span>
                  Fais retirer les données publiées
                </h2>
                <p className="muted">
                  Écris d'abord au site qui publie tes données pour demander leur effacement. S'il ne répond pas ou
                  reste introuvable, signale la page à son hébergeur : il doit agir sur un signalement précis.
                </p>
                <div className="btn-row">
                  <a
                    className="btn btn--primary"
                    href={href('/lettre', { type: 'effacement', contexte: 'exposition' })}
                  >
                    Écrire au site
                  </a>
                  <a className="btn" href={href('/lettre', { type: 'signalement' })}>
                    Signaler à l'hébergeur
                  </a>
                </div>
                <p className="hint verify__credit">
                  Garde des preuves avant tout : captures d'écran datées et adresse exacte des pages. Les démarches
                  selon la donnée exposée sont sur la page <a href={href('/que-faire')}>Que faire ?</a>
                </p>
              </section>
            )}

            {situation === 'verifier' && (
              <section className="card" aria-labelledby={`${id}-s1`}>
                <h2 className="card__title" id={`${id}-s1`}>
                  <span className="card__num">1</span>
                  Cherche ton adresse e-mail
                </h2>
                <p className="muted">
                  Have I Been Pwned, le service de référence, liste les fuites qui contiennent ton adresse. Fais la
                  recherche sur leur site, puis reviens coller la page de résultats : Shred coche les fuites pour toi.
                </p>
                <ExternalLink href={HIBP_URL} className="btn btn--primary">
                  Ouvrir Have I Been Pwned
                  <Icon name="external" size={16} />
                </ExternalLink>
                {catalog && catalog.breaches.length > 0 && <PasteResults breaches={catalog.breaches} onAdd={addMany} />}
                <details className="verify__none">
                  <summary>Have I Been Pwned n'a rien trouvé ?</summary>
                  <p>
                    Bonne nouvelle, mais pas une garantie : le service ne connaît que les fuites rendues publiques et ne
                    voit que l'adresse cherchée. Refais la recherche avec tes autres adresses, anciennes comprises.
                  </p>
                  <p>
                    Une entreprise t'a prévenu d'une fuite ?{' '}
                    <button type="button" className="link-button" onClick={() => setSituation('message')}>
                      Pars du message reçu
                    </button>
                    .
                  </p>
                </details>
              </section>
            )}

            {situation !== 'publie' && (
              <section className="card" aria-labelledby={`${id}-s2`}>
                <h2 className="card__title" id={`${id}-s2`}>
                  <span className="card__num">{situation === 'message' ? 1 : 2}</span>
                  {situation === 'message' ? "Trouve l'entreprise" : 'Coche les fuites trouvées'}
                </h2>

                {catalog === null && <p className="muted">Chargement de la liste des fuites…</p>}

                {unavailable && (
                  <Notice tone="warn">
                    <p>La liste des fuites n'est pas disponible dans cette version du site.</p>
                    <p>
                      Tu peux quand même écrire ta lettre :{' '}
                      <a href={href('/lettre', { contexte: 'violation' })}>
                        choisis « Une entreprise a subi une fuite »
                      </a>
                      .
                    </p>
                  </Notice>
                )}

                {catalog && catalog.breaches.length > 0 && (
                  <>
                    {chosen.length > 0 && (
                      <div className="picked">
                        <p className="picked__title">
                          {chosen.length} fuite{chosen.length > 1 ? 's' : ''} choisie{chosen.length > 1 ? 's' : ''}
                        </p>
                        <ul>
                          {chosen.map((b) => (
                            <li key={b.name}>
                              <button
                                type="button"
                                className="fresh__item"
                                onClick={() => toggle(b.name)}
                                aria-label={`Retirer ${b.title}`}
                              >
                                {b.title}
                                <Icon name="close" size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {fresh.length > 0 && lastVisit && (
                      <div className="fresh" role="status">
                        <p>
                          <strong>
                            {fresh.length} nouvelle{fresh.length > 1 ? 's' : ''} fuite{fresh.length > 1 ? 's' : ''}{' '}
                            française{fresh.length > 1 ? 's' : ''}
                          </strong>{' '}
                          depuis ta dernière visite, le {formatLongFr(lastVisit)} :
                        </p>
                        <ul>
                          {fresh.slice(0, 6).map((b) => (
                            <li key={b.name}>
                              <button type="button" className="fresh__item" onClick={() => toggle(b.name)}>
                                {selected.includes(b.name) && <Icon name="check" size={14} />}
                                {b.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="field">
                      <label htmlFor={`${id}-q`}>
                        {situation === 'message' ? "Nom de l'entreprise ou du site" : 'Nom de la fuite ou du site'}
                      </label>
                      <input
                        id={`${id}-q`}
                        className="input"
                        type="search"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setExpanded(false);
                        }}
                        placeholder={
                          situation === 'message'
                            ? 'Ex. le nom cité dans le message reçu'
                            : 'Ex. le nom affiché par Have I Been Pwned'
                        }
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
                      {(expanded ? results : results.slice(0, FIRST_ROWS)).map((b) => (
                        <BreachRow
                          key={b.name}
                          breach={b}
                          selected={selected.includes(b.name)}
                          onToggle={() => toggle(b.name)}
                        />
                      ))}
                    </ul>
                    {!expanded && results.length > FIRST_ROWS && (
                      <button type="button" className="btn btn--sm breach-list__more" onClick={() => setExpanded(true)}>
                        <Icon name="plus" size={16} />
                        Afficher {results.length - FIRST_ROWS} fuite{results.length - FIRST_ROWS > 1 ? 's' : ''} de plus
                      </button>
                    )}
                    {situation === 'message' && (
                      <p className="hint verify__credit">
                        L'entreprise n'est pas dans la liste ?{' '}
                        <a href={href('/lettre', { contexte: 'violation' })}>Écris-lui directement</a> : la lettre
                        s'adapte à une fuite subie par l'entreprise.
                      </p>
                    )}
                    <p className="hint verify__credit">
                      Liste des fuites : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
                      <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
                      {catalog.fetchedOn && <>, mise à jour le {formatLongFr(catalog.fetchedOn)}</>}. Ce sont des
                      informations publiques sur les fuites, pas les données fuitées.
                    </p>
                  </>
                )}
              </section>
            )}

            {situation !== 'publie' && chosen.length > 0 && (
              <section className="card" aria-labelledby={`${id}-s3`} ref={nextStep}>
                <h2 className="card__title" id={`${id}-s3`} tabIndex={-1}>
                  <span className="card__num">{situation === 'message' ? 2 : 3}</span>
                  Ce qui a fuité, et quoi faire
                </h2>
                <div className="chips verify__exposed">
                  {exposed.map((dc) => (
                    <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                      {dataClassLabel(dc)}
                    </span>
                  ))}
                </div>

                <ActionPlan dataClasses={exposed} />

                <ul className="letter-targets">
                  {chosen.map((b) => (
                    <li key={b.name}>
                      <div>
                        <strong>{b.title}</strong>
                        <span className="hint">
                          Fuite du {formatLongFr(b.date)}
                          {breachPaths.has(b.name) && (
                            <>
                              {' · '}
                              <a href={breachPaths.get(b.name)}>Tout savoir sur cette fuite</a>
                            </>
                          )}
                        </span>
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
                {chosen.length > 1 && <BatchLetters breaches={chosen} />}
              </section>
            )}
          </div>

          <aside className="verify__side">
            <details className="verify__tools" open={toolsOpen}>
              <summary>
                <Icon name="lock" size={16} />
                Mots de passe : tester ou en créer un
              </summary>
              <div className="verify__tools-body">
                <PasswordCheck />
                <PasswordGenerator />
              </div>
            </details>
          </aside>
        </div>
      </div>

      {situation !== 'publie' && chosen.length > 0 && !nextVisible && (
        <div className="verify-bar">
          <span>
            {chosen.length} fuite{chosen.length > 1 ? 's' : ''} choisie{chosen.length > 1 ? 's' : ''}
          </span>
          <button type="button" className="btn btn--primary btn--sm" onClick={goToNextStep}>
            Voir quoi faire
            <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </>
  );
}
