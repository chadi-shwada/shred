import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { IconName } from '../components/Icon';
import { loadBreachCatalog } from '../breachCatalog';
import { readStorage, writeStorage } from '../browser';
import { ActionPlan } from '../components/ActionPlan';
import { BatchLetters } from '../components/BatchLetters';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { BreachMark } from '../components/BreachMark';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { PasteResults } from '../components/PasteResults';
import { breachPathsByName } from '../lib/breachPages';
import {
  dataClassLabel,
  formatCount,
  HIBP_LICENSE_URL,
  LOGO_NOTICE,
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

/** Ce que la personne veut vérifier (paramètre « parcours » du fragment). */
type Situation = 'verifier' | 'mot-de-passe' | 'message' | 'publie';

const SITUATIONS: { value: Situation; label: string; hint: string; icon: IconName }[] = [
  { value: 'verifier', label: 'Mon adresse e-mail', hint: 'a-t-elle fuité ?', icon: 'mail' },
  { value: 'mot-de-passe', label: 'Un mot de passe', hint: 'a-t-il fuité ? en créer un solide', icon: 'lock' },
  { value: 'message', label: "Une entreprise m'a prévenu", hint: 'e-mail ou courrier reçu', icon: 'alert' },
  { value: 'publie', label: 'Mes données sont publiées', hint: 'sur un site ou un forum', icon: 'database' },
];

function asSituation(value: string | null): Situation {
  return value === 'message' || value === 'publie' || value === 'mot-de-passe' ? value : 'verifier';
}

/** Types de données qui imposent de changer ses mots de passe. */
const PASSWORD_CLASSES = new Set(['Passwords', 'Historical passwords', 'Password hints']);

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
        ShredRGPD calcule l'empreinte SHA-1 dans ton navigateur et n'envoie que ses 5 premiers caractères à{' '}
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
            <BreachMark title={breach.title} name={breach.name} size="sm" />
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

/** Indicateur d'étapes cliquable (mêmes styles que le générateur de lettre). */
function Stepper({
  steps,
  step,
  reached,
  onGo,
}: {
  steps: string[];
  step: number;
  reached: number;
  onGo: (n: number) => void;
}) {
  return (
    <nav aria-label="Étapes">
      <ol className={`stepper stepper--${steps.length}`}>
        {steps.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label} data-state={n === step ? 'current' : n <= reached ? 'done' : 'todo'}>
              <button
                type="button"
                onClick={() => onGo(n)}
                disabled={n > reached}
                aria-current={n === step ? 'step' : undefined}
              >
                <span className="stepper__num" aria-hidden="true">
                  {n < step ? <Icon name="check" size={14} /> : n}
                </span>
                <span className="stepper__label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="stepper__compact" aria-hidden="true">
        Étape {step} sur {steps.length} · {steps[step - 1]}
      </p>
    </nav>
  );
}

/**
 * Parcours « fuites » en étapes, une à la fois : chercher son e-mail sur Have I
 * Been Pwned (mode « verifier ») ou partir du message reçu (« message »), cocher
 * les fuites, puis voir quoi faire.
 */
function BreachFlow({ mode, catalog }: { mode: 'verifier' | 'message'; catalog: BreachCatalog | null }) {
  const id = useId();
  const steps =
    mode === 'verifier'
      ? ['Cherche ton e-mail', 'Coche les fuites', 'Quoi faire']
      : ["Trouve l'entreprise", 'Quoi faire'];
  const last = steps.length;
  const pickStep = mode === 'verifier' ? 2 : 1;
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const goTo = (n: number) => {
    setStep(n);
    setReached((r) => Math.max(r, n));
  };

  // Changement d'étape : retour en haut du parcours, focus sur le titre de l'étape.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView({ block: 'start' });
  }, [step]);

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
  const passwordsLeaked = exposed.some((dc) => PASSWORD_CLASSES.has(dc));

  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  const addMany = (names: string[]) => {
    setSelected((s) => [...s, ...names.filter((n) => !s.includes(n))]);
    goTo(pickStep);
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

  const titleProps = { ref: heading, tabIndex: -1 } as const;

  return (
    <div className="verify-flow" ref={top}>
      <Stepper steps={steps} step={step} reached={reached} onGo={goTo} />

      {mode === 'verifier' && step === 1 && (
        <section className="card" aria-labelledby={`${id}-s1`}>
          <h2 className="card__title" id={`${id}-s1`} {...titleProps}>
            <span className="card__num">1</span>
            Cherche ton adresse e-mail
          </h2>
          <p className="muted">
            Have I Been Pwned, le service de référence, liste les fuites qui contiennent ton adresse. Ton e-mail ne
            passe jamais par ShredRGPD : tu le tapes sur leur site.
          </p>
          <ol className="howto">
            <li>
              <span className="howto__num">1</span>
              <div>
                <strong>Ouvre Have I Been Pwned et tape ton adresse e-mail.</strong>
                <ExternalLink href={HIBP_URL} className="btn btn--primary btn--sm">
                  Ouvrir Have I Been Pwned
                  <Icon name="external" size={16} />
                </ExternalLink>
              </div>
            </li>
            <li>
              <span className="howto__num">2</span>
              <div>
                <strong>Sur la page de résultats, sélectionne tout et copie.</strong>
                <span className="hint">
                  Ctrl+A puis Ctrl+C, ou « Tout sélectionner » puis « Copier » sur téléphone.
                </span>
              </div>
            </li>
            <li>
              <span className="howto__num">3</span>
              <div>
                <strong>Colle ici : ShredRGPD reconnaît les fuites pour toi.</strong>
                {catalog && catalog.breaches.length > 0 && <PasteResults breaches={catalog.breaches} onAdd={addMany} />}
              </div>
            </li>
          </ol>
          <div className="wizard__nav">
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => goTo(2)}>
                Je préfère chercher les fuites moi-même
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
          <details className="verify__none">
            <summary>Have I Been Pwned n'a rien trouvé ?</summary>
            <p>
              Bonne nouvelle, mais pas une garantie : le service ne connaît que les fuites rendues publiques et ne voit
              que l'adresse cherchée. Refais la recherche avec tes autres adresses, anciennes comprises. Pense aussi à{' '}
              <a href={href('/verifier', { parcours: 'mot-de-passe' })}>tester tes mots de passe</a>.
            </p>
          </details>
        </section>
      )}

      {step === pickStep && (
        <section className="card" aria-labelledby={`${id}-s2`}>
          <h2 className="card__title" id={`${id}-s2`} {...titleProps}>
            <span className="card__num">{pickStep}</span>
            {mode === 'message' ? "Trouve l'entreprise" : 'Coche les fuites qui te concernent'}
          </h2>

          {catalog === null && <p className="muted">Chargement de la liste des fuites…</p>}

          {unavailable && (
            <Notice tone="warn">
              <p>La liste des fuites n'est pas disponible dans cette version du site.</p>
              <p>
                Tu peux quand même écrire ta lettre :{' '}
                <a href={href('/lettre', { contexte: 'violation' })}>choisis « Une entreprise a subi une fuite »</a>.
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
                      {fresh.length} nouvelle{fresh.length > 1 ? 's' : ''} fuite{fresh.length > 1 ? 's' : ''} française
                      {fresh.length > 1 ? 's' : ''}
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
                  {mode === 'message' ? "Nom de l'entreprise ou du site" : 'Nom de la fuite ou du site'}
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
                    mode === 'message'
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
              {mode === 'message' && (
                <p className="hint verify__credit">
                  L'entreprise n'est pas dans la liste ?{' '}
                  <a href={href('/lettre', { contexte: 'violation' })}>Écris-lui directement</a> : la lettre s'adapte à
                  une fuite subie par l'entreprise.
                </p>
              )}
              <p className="hint verify__credit">
                Liste des fuites : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
                <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
                {catalog.fetchedOn && <>, mise à jour le {formatLongFr(catalog.fetchedOn)}</>}. Ce sont des informations
                publiques sur les fuites, pas les données fuitées. {LOGO_NOTICE}
              </p>
            </>
          )}

          <div className="wizard__nav">
            {chosen.length === 0 && catalog && catalog.breaches.length > 0 && (
              <p className="hint">Coche au moins une fuite pour voir quoi faire.</p>
            )}
            <div className="btn-row">
              {pickStep > 1 && (
                <button type="button" className="btn" onClick={() => goTo(pickStep - 1)}>
                  Retour
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => goTo(last)}
                disabled={chosen.length === 0}
              >
                Voir quoi faire
                {chosen.length > 0 && ` (${chosen.length} fuite${chosen.length > 1 ? 's' : ''})`}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === last && (
        <section className="card" aria-labelledby={`${id}-s3`}>
          <h2 className="card__title" id={`${id}-s3`} {...titleProps}>
            <span className="card__num">{last}</span>
            Ce qui a fuité, et quoi faire
          </h2>
          {chosen.length === 0 ? (
            <p className="muted">Aucune fuite cochée pour l'instant.</p>
          ) : (
            <>
              <div className="chips verify__exposed">
                {exposed.map((dc) => (
                  <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                    {dataClassLabel(dc)}
                  </span>
                ))}
              </div>

              {passwordsLeaked && (
                <div className="callout callout--danger">
                  <span className="callout__icon" aria-hidden="true">
                    <Icon name="lock" />
                  </span>
                  <div>
                    <strong>Des mots de passe font partie de ces fuites.</strong>
                    <p>
                      Teste ceux que tu utilises encore, sans les confier à personne, et change ceux qui sont connus.
                    </p>
                    <a className="btn btn--primary btn--sm" href={href('/verifier', { parcours: 'mot-de-passe' })}>
                      Tester mes mots de passe
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                </div>
              )}

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
            </>
          )}
          <div className="wizard__nav">
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => goTo(pickStep)}>
                Retour aux fuites
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** Parcours « mot de passe » : fonctionnement visible, test, générateur et bons réflexes. */
function PasswordFlow() {
  return (
    <div className="password-flow">
      <section className="card" aria-labelledby="mdp-comment">
        <h2 className="card__title" id="mdp-comment">
          <span className="card__num">
            <Icon name="shield" size={14} />
          </span>
          Ton mot de passe ne quitte jamais ton appareil
        </h2>
        <ol className="how-pw">
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <strong>Empreinte calculée ici</strong>
            <span>Ton navigateur transforme le mot de passe en empreinte SHA-1.</span>
          </li>
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="send" />
            </span>
            <strong>5 caractères envoyés</strong>
            <span>Seul le début de l'empreinte part vers Pwned Passwords, jamais le mot de passe.</span>
          </li>
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="check" />
            </span>
            <strong>Comparaison chez toi</strong>
            <span>
              Le service renvoie des centaines d'empreintes ; ShredRGPD cherche la tienne dans ton navigateur.
            </span>
          </li>
        </ol>
      </section>

      <div className="password-flow__tools">
        <PasswordCheck />
        <PasswordGenerator />
      </div>

      <section className="card" aria-labelledby="mdp-reflexes">
        <h2 className="card__title" id="mdp-reflexes">
          <span className="card__num">
            <Icon name="check" size={14} />
          </span>
          Les bons réflexes
        </h2>
        <ul className="checklist">
          <li>
            <Icon name="check" size={18} />
            Un mot de passe apparaît dans une fuite ? Change-le partout où il sert, en commençant par ta messagerie.
          </li>
          <li>
            <Icon name="check" size={18} />
            Un mot de passe différent par site : un gestionnaire de mots de passe les retient pour toi.
          </li>
          <li>
            <Icon name="check" size={18} />
            Active la double authentification sur ta messagerie, ta banque et tes réseaux sociaux.
          </li>
        </ul>
        <p className="hint">
          Tu veux savoir quels sites ont laissé fuiter tes données ?{' '}
          <a href={href('/verifier')}>Vérifie ton adresse e-mail</a>.
        </p>
      </section>
    </div>
  );
}

export function Verify() {
  const id = useId();
  const route = useRoute();
  const situation = asSituation(route.query.get('parcours'));
  const setSituation = (value: Situation) =>
    navigate(href('/verifier', value === 'verifier' ? undefined : { parcours: value }), { replace: true });
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

  return (
    <>
      <PageHead
        eyebrow="Vérifier"
        command={{ input: 'shredrgpd verifier --email ••••••', output: 'aucune donnée envoyée à ShredRGPD' }}
        title="Qu'est-ce qui a fuité ?"
      >
        Vérifie ton adresse e-mail ou un mot de passe, vois quelles données sont exposées, puis écris à l'entreprise en
        un clic. Rien de ce que tu vérifies ne passe par ShredRGPD.
      </PageHead>

      <div className="container page-body verify-page">
        <fieldset className="situation">
          <legend className="situation__legend">Que veux-tu vérifier ?</legend>
          <div className="choices">
            {SITUATIONS.map((s) => (
              <label key={s.value} className="choice">
                <input
                  type="radio"
                  name={`${id}-situation`}
                  value={s.value}
                  checked={situation === s.value}
                  onChange={() => setSituation(s.value)}
                />
                <span className="choice__icon" aria-hidden="true">
                  <Icon name={s.icon} />
                </span>
                <strong>{s.label}</strong>
                <span className="choice__hint">{s.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {situation === 'mot-de-passe' && <PasswordFlow />}

        {(situation === 'verifier' || situation === 'message') && (
          <BreachFlow key={situation} mode={situation} catalog={catalog} />
        )}

        {situation === 'publie' && (
          <section className="card" aria-labelledby={`${id}-pub`}>
            <h2 className="card__title" id={`${id}-pub`}>
              <span className="card__num">1</span>
              Fais retirer les données publiées
            </h2>
            <p className="muted">
              Écris d'abord au site qui publie tes données pour demander leur effacement. S'il ne répond pas ou reste
              introuvable, signale la page à son hébergeur : il doit agir sur un signalement précis.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href={href('/lettre', { type: 'effacement', contexte: 'exposition' })}>
                Écrire au site
              </a>
              <a className="btn" href={href('/lettre', { type: 'signalement' })}>
                Signaler à l'hébergeur
              </a>
            </div>
            <p className="hint verify__credit">
              Garde des preuves avant tout : captures d'écran datées et adresse exacte des pages. Les démarches selon la
              donnée exposée sont sur la page <a href={href('/que-faire')}>Que faire ?</a>
            </p>
          </section>
        )}
      </div>
    </>
  );
}
