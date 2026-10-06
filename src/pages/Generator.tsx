import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { copyText, downloadText } from '../browser';
import { ShredBurst } from '../components/ShredBurst';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { formatLongFr, gdprDeadlines, isValidIsoDate, todayIso, type IsoDate } from '../lib/dates';
import {
  DATA_CATEGORIES,
  generateLetter,
  INITIAL_KINDS,
  isInitialKind,
  LetterInputError,
  letterToText,
  mailtoHref,
  type DataCategory,
  type InitialKind,
  type Letter,
  type LetterContext,
  type ReportTarget,
  type LetterKind,
} from '../lib/letters';
import { CLOUDFLARE_ABUSE_URL, extractDomain, icannLookupUrl } from '../lib/domain';
import { parseCategories } from '../lib/letterLink';
import { slugify } from '../lib/slug';
import { newId, withLetter, type TrackedRequest } from '../lib/tracking';
import { href, type Route } from '../router';
import { useTracking } from '../useTracking';

interface FormState {
  kind: LetterKind;
  fullName: string;
  email: string;
  postalAddress: string;
  siteName: string;
  contact: string;
  urls: string;
  dataCategories: DataCategory[];
  otherData: string;
  date: IsoDate;
  previousRequestDate: IsoDate;
  previousKind: InitialKind;
  context: LetterContext;
  breachName: string;
  breachDate: IsoDate;
  reportTarget: ReportTarget;
}

const KIND_OPTIONS: { value: LetterKind; label: string; hint: string }[] = [
  { value: 'effacement', label: 'Effacement', hint: 'Article 17' },
  { value: 'acces', label: 'Accès', hint: 'Article 15' },
  { value: 'opposition', label: 'Opposition', hint: 'Prospection, art. 21' },
  { value: 'fermeture', label: 'Fermer un compte', hint: 'Article 17' },
  { value: 'relance', label: 'Relance', hint: 'Après un mois' },
  { value: 'signalement', label: 'Signalement', hint: 'Hébergeur, registrar' },
];

const TARGET_OPTIONS: { value: ReportTarget; label: string }[] = [
  { value: 'hebergeur', label: "L'hébergeur du site" },
  { value: 'registrar', label: 'Le registrar du nom de domaine' },
  { value: 'cloudflare', label: 'Cloudflare' },
];

function asKind(value: string | null): LetterKind {
  if (isInitialKind(value) || value === 'relance' || value === 'signalement') return value;
  return 'effacement';
}

function initialState(route: Route): FormState {
  const q = route.query;
  const since = q.get('depuis') ?? '';
  const breachDate = q.get('date-fuite') ?? '';
  return {
    kind: asKind(q.get('type')),
    fullName: '',
    email: '',
    postalAddress: '',
    siteName: q.get('site') ?? '',
    contact: '',
    urls: '',
    dataCategories: parseCategories(q.get('donnees')),
    otherData: q.get('autres') ?? '',
    date: todayIso(),
    previousRequestDate: isValidIsoDate(since) ? since : '',
    previousKind: isInitialKind(q.get('premiere')) ? (q.get('premiere') as InitialKind) : 'effacement',
    context: q.get('contexte') === 'violation' ? 'violation' : 'exposition',
    breachName: q.get('fuite') ?? '',
    breachDate: isValidIsoDate(breachDate) ? breachDate : '',
    reportTarget:
      q.get('cible') === 'registrar' || q.get('cible') === 'cloudflare'
        ? (q.get('cible') as ReportTarget)
        : 'hebergeur',
  };
}

type Feedback = { tone: 'ok' | 'warn'; text: string } | null;

/** Étapes du formulaire, une à la fois. */
type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Type de demande' },
  { n: 2, label: 'Le site' },
  { n: 3, label: 'Ce qui a fuité' },
  { n: 4, label: 'Toi' },
  { n: 5, label: 'Ta lettre' },
];

/**
 * Étape de départ : un lien pré-rempli (page de fuite, relance depuis le suivi)
 * a déjà le type et le site, on commence à « Toi » ; un type seul, au site.
 */
function firstStep(route: Route): Step {
  if (route.query.get('site')) return 4;
  if (route.query.get('type')) return 2;
  return 1;
}

export function Generator({ route }: { route: Route }) {
  const [form, setForm] = useState<FormState>(() => initialState(route));
  const [step, setStep] = useState<Step>(() => firstStep(route));
  /** Étape la plus avancée atteinte : on peut revenir en arrière ou y retourner d'un clic. */
  const [reached, setReached] = useState<Step>(() => firstStep(route));
  const [stepError, setStepError] = useState<string[]>([]);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  /** Rejoue l'animation du broyeur à chaque copie ou téléchargement réussi. */
  const [burst, setBurst] = useState(0);
  const [keepCopy, setKeepCopy] = useState(false);
  const { requests, update, saveFailed } = useTracking();
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const trackedId = route.query.get('suivi');
  const tracked = trackedId ? requests.find((r) => r.id === trackedId) : undefined;

  const set =
    <K extends keyof FormState>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: event.target.value as FormState[K] }));
      setFeedback(null);
    };

  const toggleCategory = (key: DataCategory) => {
    setForm((f) => ({
      ...f,
      dataCategories: f.dataCategories.includes(key)
        ? f.dataCategories.filter((k) => k !== key)
        : [...f.dataCategories, key],
    }));
    setFeedback(null);
  };

  const result = useMemo((): { letter: Letter | null; missing: string[] } => {
    const missing: string[] = [];
    if (!form.fullName.trim()) missing.push('ton nom');
    if (!form.siteName.trim())
      missing.push(
        form.context === 'violation' && form.kind !== 'signalement' ? "le nom de l'entreprise" : 'le site concerné',
      );
    if (form.kind === 'relance' && !isValidIsoDate(form.previousRequestDate))
      missing.push('la date de ta première demande');
    if (!isValidIsoDate(form.date)) missing.push('la date de la lettre');
    if (form.kind === 'signalement') {
      if (!form.urls.split('\n').some((u) => u.trim())) missing.push("l'adresse d'au moins une page");
      if (!form.email.trim()) missing.push('ton adresse e-mail');
    }
    if (missing.length > 0) return { letter: null, missing };
    try {
      const letter = generateLetter({
        kind: form.kind,
        fullName: form.fullName,
        email: form.email,
        postalAddress: form.postalAddress,
        siteName: form.kind === 'signalement' ? (extractDomain(form.siteName) ?? form.siteName) : form.siteName,
        urls: form.urls.split('\n'),
        dataCategories: form.dataCategories,
        otherData: form.otherData,
        date: form.date,
        previousRequestDate: form.kind === 'relance' ? form.previousRequestDate : undefined,
        previousKind: form.kind === 'relance' ? form.previousKind : undefined,
        context: form.kind === 'signalement' ? 'exposition' : form.context,
        reportTarget: form.reportTarget,
        breachName: form.context === 'violation' && form.kind !== 'signalement' ? form.breachName : undefined,
        breachDate: form.context === 'violation' && isValidIsoDate(form.breachDate) ? form.breachDate : undefined,
      });
      return { letter, missing };
    } catch (error) {
      if (error instanceof LetterInputError) return { letter: null, missing: [error.message] };
      throw error;
    }
  }, [form]);

  const { letter } = result;
  const relanceTooEarly =
    form.kind === 'relance' &&
    isValidIsoDate(form.previousRequestDate) &&
    isValidIsoDate(form.date) &&
    form.date <= gdprDeadlines(form.previousRequestDate).standard;

  const onCopy = async () => {
    if (!letter) return;
    const ok = await copyText(letterToText(letter));
    if (ok) setBurst((n) => n + 1);
    setFeedback(
      ok
        ? { tone: 'ok', text: 'Lettre copiée. Colle-la dans ton e-mail ou dans le formulaire du site.' }
        : { tone: 'warn', text: 'La copie a échoué. Sélectionne le texte de la lettre à la main.' },
    );
  };

  const onDownload = () => {
    if (!letter) return;
    downloadText(`shred-${form.kind}-${slugify(form.siteName)}.txt`, letterToText(letter));
    setBurst((n) => n + 1);
  };

  const onTrack = () => {
    if (!letter) return;
    const copy = { date: form.date, subject: letter.subject, body: letter.body };
    if (form.kind === 'relance') {
      if (!tracked) return;
      update((list) =>
        list.map((r) =>
          r.id === tracked.id ? { ...(keepCopy ? withLetter(r, copy) : r), status: 'relancee' as const } : r,
        ),
      );
      setFeedback({ tone: 'ok', text: 'La demande est marquée comme relancée dans ton suivi.' });
      return;
    }
    const request: TrackedRequest = {
      id: newId(),
      site: form.siteName.trim(),
      kind: form.kind as InitialKind,
      channel: 'email',
      sentOn: form.date,
      status: 'envoyee',
      notes: '',
      context: form.context,
    };
    update((list) => [...list, keepCopy ? withLetter(request, copy) : request]);
    setFeedback({
      tone: 'ok',
      text: `Ajoutée au suivi. Échéance de réponse : ${formatLongFr(gdprDeadlines(form.date).standard)}.`,
    });
  };

  const canTrack = form.kind === 'relance' ? Boolean(tracked) : form.kind !== 'signalement';
  const isReport = form.kind === 'signalement';
  const violation = form.context === 'violation' && !isReport;

  /** Ce qu'il manque pour quitter une étape (mêmes règles que la lettre). */
  const missingAt = (n: Step): string[] => {
    const missing: string[] = [];
    if (n === 1 && form.kind === 'relance' && !isValidIsoDate(form.previousRequestDate))
      missing.push('la date de ta première demande');
    if (n === 2 && !form.siteName.trim()) missing.push(violation ? "le nom de l'entreprise" : 'le site concerné');
    if (n === 3 && isReport && !form.urls.split('\n').some((u) => u.trim()))
      missing.push("l'adresse d'au moins une page");
    if (n === 4) {
      if (!form.fullName.trim()) missing.push('ton nom');
      if (isReport && !form.email.trim()) missing.push('ton adresse e-mail');
      if (!isValidIsoDate(form.date)) missing.push('la date de la lettre');
    }
    return missing;
  };

  const goTo = (n: Step) => {
    setStepError([]);
    setStep(n);
    setReached((r) => (n > r ? n : r));
  };

  const next = () => {
    const missing = missingAt(step);
    if (missing.length > 0) {
      setStepError(missing);
      return;
    }
    if (step < 5) goTo((step + 1) as Step);
  };

  // Changement d'étape : focus sur son titre (lecteurs d'écran) et retour en haut du formulaire.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeading.current?.focus({ preventScroll: true });
    document.getElementById(fieldId('wizard'))?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepNav = (
    <div className="wizard__nav">
      {stepError.length > 0 && (
        <p className="wizard__error" role="alert">
          Pour continuer, indique {stepError.join(', ')}.
        </p>
      )}
      <div className="btn-row">
        {step > 1 && (
          <button type="button" className="btn" onClick={() => goTo((step - 1) as Step)}>
            Retour
          </button>
        )}
        {step < 5 && (
          <button type="submit" className="btn btn--primary">
            {step === 4 ? 'Voir ma lettre' : 'Continuer'}
            <Icon name="arrow" size={18} />
          </button>
        )}
      </div>
    </div>
  );
  const domain = extractDomain(form.siteName);

  return (
    <>
      <PageHead
        eyebrow="Générateur"
        command={{ input: 'shredrgpd lettre --rgpd art.17', output: "modèle prêt · rien n'est envoyé" }}
        title="Écris ta lettre"
      >
        Cinq étapes courtes : le type de demande, le site, ce qui a fuité, toi, puis ta lettre prête à envoyer. Rien
        n'est envoyé, rien n'est enregistré tant que tu ne l'ajoutes pas au suivi.
      </PageHead>

      <div className="container page-body">
        <div className="wizard" id={fieldId('wizard')}>
          <nav aria-label="Étapes de la lettre">
            <ol className="stepper">
              {STEPS.map((st) => (
                <li key={st.n} data-state={st.n === step ? 'current' : st.n <= reached ? 'done' : 'todo'}>
                  <button
                    type="button"
                    onClick={() => goTo(st.n)}
                    disabled={st.n > reached}
                    aria-current={st.n === step ? 'step' : undefined}
                  >
                    <span className="stepper__num" aria-hidden="true">
                      {st.n < step && st.n <= reached ? <Icon name="check" size={14} /> : st.n}
                    </span>
                    <span className="stepper__label">{st.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="stepper__compact" aria-hidden="true">
              Étape {step} sur 5 · {STEPS[step - 1]!.label}
            </p>
          </nav>

          {step < 5 && (
            <form
              className="generator__form"
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
              noValidate
            >
              {step === 1 && (
                <section className="card" aria-labelledby={fieldId('t1')}>
                  <h2 className="card__title" id={fieldId('t1')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">1</span>
                    Quel type de demande ?
                  </h2>
                  <fieldset>
                    <legend className="visually-hidden">Type de demande</legend>
                    <div className="segmented">
                      {KIND_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name={fieldId('kind')}
                            value={option.value}
                            checked={form.kind === option.value}
                            onChange={set('kind')}
                          />
                          <strong>{option.label}</strong>
                          <span>{option.hint}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {form.kind === 'relance' && (
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor={fieldId('prevDate')}>Date de ta première demande</label>
                        <input
                          id={fieldId('prevDate')}
                          className="input"
                          type="date"
                          value={form.previousRequestDate}
                          onChange={set('previousRequestDate')}
                          max={form.date}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={fieldId('prevKind')}>Nature de la première demande</label>
                        <select
                          id={fieldId('prevKind')}
                          className="select"
                          value={form.previousKind}
                          onChange={set('previousKind')}
                        >
                          {(Object.keys(INITIAL_KINDS) as InitialKind[]).map((k) => (
                            <option key={k} value={k}>
                              {INITIAL_KINDS[k].label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {step === 2 && (
                <section className="card" aria-labelledby={fieldId('t2')}>
                  <h2 className="card__title" id={fieldId('t2')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">2</span>
                    {isReport ? 'Le site et le destinataire' : 'Le site ou l’entreprise'}
                  </h2>
                  {isReport ? (
                    <div className="field">
                      <label htmlFor={fieldId('target')}>Destinataire du signalement</label>
                      <select
                        id={fieldId('target')}
                        className="select"
                        value={form.reportTarget}
                        onChange={set('reportTarget')}
                      >
                        {TARGET_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor={fieldId('context')}>Situation</label>
                      <select id={fieldId('context')} className="select" value={form.context} onChange={set('context')}>
                        <option value="exposition">Un site publie mes données issues d'une fuite</option>
                        <option value="violation">Une entreprise a subi une fuite de mes données</option>
                      </select>
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor={fieldId('site')}>
                      {violation ? "Nom de l'entreprise" : 'Nom ou adresse du site'}
                    </label>
                    <input
                      id={fieldId('site')}
                      className="input"
                      value={form.siteName}
                      onChange={set('siteName')}
                      placeholder="exemple.com"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {violation && (
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor={fieldId('breachName')}>
                          Nom de la fuite <span className="optional">(facultatif)</span>
                        </label>
                        <input
                          id={fieldId('breachName')}
                          className="input"
                          value={form.breachName}
                          onChange={set('breachName')}
                          autoComplete="off"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={fieldId('breachDate')}>
                          Date de la fuite <span className="optional">(facultatif)</span>
                        </label>
                        <input
                          id={fieldId('breachDate')}
                          className="input"
                          type="date"
                          value={form.breachDate}
                          onChange={set('breachDate')}
                        />
                      </div>
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor={fieldId('contact')}>
                      {isReport ? "E-mail d'abus du destinataire" : 'E-mail du DPO ou du responsable'}{' '}
                      <span className="optional">(facultatif)</span>
                    </label>
                    <input
                      id={fieldId('contact')}
                      className="input"
                      type="email"
                      value={form.contact}
                      onChange={set('contact')}
                      placeholder="dpo@exemple.com"
                      autoComplete="off"
                      spellCheck={false}
                      aria-describedby={fieldId('contactHint')}
                    />
                    <p className="hint" id={fieldId('contactHint')}>
                      {isReport
                        ? 'Souvent de la forme abuse@… Il sert seulement à préremplir ton e-mail.'
                        : 'Cherche-le dans les mentions légales ou la politique de confidentialité du site. Il sert seulement à préremplir ton e-mail.'}
                    </p>
                  </div>
                  {!violation && (
                    <div className="finder">
                      <p className="finder__title">
                        <Icon name="search" size={16} />
                        Trouver le bon contact
                      </p>
                      <ul>
                        {!isReport && (
                          <li>
                            Le responsable du site : ses mentions légales ou sa politique de confidentialité (lien en
                            bas de page, souvent).
                          </li>
                        )}
                        <li>
                          Le registrar et son e-mail d'abus :{' '}
                          {domain ? (
                            <ExternalLink href={icannLookupUrl(domain)}>recherche ICANN pour {domain}</ExternalLink>
                          ) : (
                            <ExternalLink href="https://lookup.icann.org/">recherche ICANN</ExternalLink>
                          )}
                          , rubrique « Registrar » puis « Abuse contact ».
                        </li>
                        <li>
                          Le site passe par Cloudflare (serveurs de noms en *.ns.cloudflare.com) ? Utilise leur{' '}
                          <ExternalLink href={CLOUDFLARE_ABUSE_URL}>formulaire d'abus</ExternalLink> : il transmet à
                          l'hébergeur réel.
                        </li>
                        {!isReport && (
                          <li>
                            Personne ne répond ou le site est anonyme ? Choisis « Signalement » pour écrire à
                            l'hébergeur ou au registrar.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {step === 3 && (
                <section className="card" aria-labelledby={fieldId('t3data')}>
                  <h2 className="card__title" id={fieldId('t3data')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">3</span>
                    Ce qui a fuité
                  </h2>
                  <div className="field">
                    <label htmlFor={fieldId('urls')}>
                      Pages où tes données apparaissent{' '}
                      <span className="optional">{isReport ? '(une par ligne)' : '(facultatif, une par ligne)'}</span>
                    </label>
                    <textarea
                      id={fieldId('urls')}
                      className="textarea"
                      value={form.urls}
                      onChange={set('urls')}
                      placeholder="https://exemple.com/page"
                      spellCheck={false}
                    />
                  </div>
                  <fieldset>
                    <legend className="legend">Données exposées</legend>
                    <div className="checks">
                      {(Object.keys(DATA_CATEGORIES) as DataCategory[]).map((key) => (
                        <label className="check" key={key}>
                          <input
                            type="checkbox"
                            checked={form.dataCategories.includes(key)}
                            onChange={() => toggleCategory(key)}
                          />
                          <span>{DATA_CATEGORIES[key].charAt(0).toUpperCase() + DATA_CATEGORIES[key].slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label htmlFor={fieldId('other')}>
                      Autres données <span className="optional">(facultatif)</span>
                    </label>
                    <input id={fieldId('other')} className="input" value={form.otherData} onChange={set('otherData')} />
                  </div>
                </section>
              )}

              {step === 4 && (
                <>
                  <section className="card" aria-labelledby={fieldId('t3')}>
                    <h2 className="card__title" id={fieldId('t3')} ref={stepHeading} tabIndex={-1}>
                      <span className="card__num">4</span>
                      Toi
                    </h2>
                    <div className="field">
                      <label htmlFor={fieldId('name')}>Ton nom complet</label>
                      <input
                        id={fieldId('name')}
                        className="input"
                        value={form.fullName}
                        onChange={set('fullName')}
                        autoComplete="name"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('email')}>
                        {isReport ? (
                          'Ton adresse e-mail'
                        ) : (
                          <>
                            E-mail concerné par la fuite <span className="optional">(facultatif)</span>
                          </>
                        )}
                      </label>
                      <input
                        id={fieldId('email')}
                        className="input"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        autoComplete="email"
                        spellCheck={false}
                        aria-describedby={fieldId('emailHint')}
                      />
                      <p className="hint" id={fieldId('emailHint')}>
                        {isReport
                          ? 'Obligatoire dans un signalement (article 16 du DSA) : le destinataire doit pouvoir te répondre.'
                          : "Aide le site à retrouver tes données. N'ajoute pas de mot de passe."}
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('address')}>
                        Adresse postale <span className="optional">(facultatif, utile pour un courrier)</span>
                      </label>
                      <textarea
                        id={fieldId('address')}
                        className="textarea"
                        value={form.postalAddress}
                        onChange={set('postalAddress')}
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('date')}>Date de la lettre</label>
                      <input
                        id={fieldId('date')}
                        className="input"
                        type="date"
                        value={form.date}
                        onChange={set('date')}
                      />
                    </div>
                  </section>

                  <Notice>
                    <p>
                      Ces champs restent dans cet onglet. Ton nom, ton e-mail et ton adresse ne sont jamais enregistrés,
                      même dans le suivi.
                    </p>
                  </Notice>
                </>
              )}

              {stepNav}
            </form>
          )}

          {step === 5 && (
            <section className="generator__preview" aria-labelledby={fieldId('preview')}>
              <div className="preview-window">
                <div className="preview-bar">
                  <h2 id={fieldId('preview')} ref={stepHeading} tabIndex={-1}>
                    Ta lettre
                  </h2>
                  {letter && (
                    <ul className="chips" aria-label="Articles du RGPD cités">
                      {letter.articles.map((article) => (
                        <li className="chip" key={article}>
                          Art. {article}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="paper-wrap">
                  <article
                    className="paper"
                    aria-live="polite"
                    aria-atomic="false"
                    aria-label="Texte de la lettre"
                    tabIndex={0}
                  >
                    {letter ? (
                      <>
                        <p className="paper__subject">Objet : {letter.subject}</p>
                        <pre className="paper__body">{letter.body}</pre>
                      </>
                    ) : (
                      <div className="paper__empty">
                        <div className="bits-art" aria-hidden="true">
                          {'01001100 01100101 01110100\n01110100 01110010 01100101\n00100000 01110000 01110010'}
                        </div>
                        <p>Pour afficher ta lettre, indique {result.missing.join(', ')}.</p>
                        <button type="button" className="btn btn--sm" onClick={() => goTo(1)}>
                          Reprendre les étapes
                        </button>
                      </div>
                    )}
                  </article>
                  {burst > 0 && <ShredBurst key={burst} />}
                </div>

                <div className="preview-actions">
                  {relanceTooEarly && (
                    <Notice tone="warn">
                      <p>
                        Le délai d'un mois court jusqu'au{' '}
                        {formatLongFr(gdprDeadlines(form.previousRequestDate).standard)} environ. Une relance avant
                        cette date reste possible, mais elle a moins de poids.
                      </p>
                    </Notice>
                  )}

                  <div className="btn-row">
                    <button type="button" className="btn btn--primary" onClick={onCopy} disabled={!letter}>
                      <Icon name="copy" size={18} />
                      Copier
                    </button>
                    {letter ? (
                      <a className="btn" href={mailtoHref(letter, form.contact)}>
                        <Icon name="mail" size={18} />
                        Ouvrir dans ma messagerie
                      </a>
                    ) : (
                      <button type="button" className="btn" disabled>
                        <Icon name="mail" size={18} />
                        Ouvrir dans ma messagerie
                      </button>
                    )}
                    <button type="button" className="btn" onClick={onDownload} disabled={!letter}>
                      <Icon name="download" size={18} />
                      Télécharger
                    </button>
                    <button type="button" className="btn" onClick={() => window.print()} disabled={!letter}>
                      <Icon name="printer" size={18} />
                      Imprimer
                    </button>
                  </div>

                  {canTrack && (
                    <label className="check small">
                      <input type="checkbox" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} />
                      <span>
                        Garder une copie de la lettre dans le suivi, pour un éventuel dossier CNIL (elle contient ton
                        nom et reste dans ce navigateur)
                      </span>
                    </label>
                  )}
                  <div className="btn-row">
                    <button type="button" className="btn btn--ghost" onClick={onTrack} disabled={!letter || !canTrack}>
                      <Icon name="plus" size={18} />
                      {form.kind === 'relance' ? 'Marquer comme relancée dans le suivi' : 'Ajouter au suivi'}
                    </button>
                    <a className="btn btn--ghost" href={href('/suivi')}>
                      Voir mon suivi
                    </a>
                  </div>

                  {form.kind === 'relance' && !tracked && (
                    <p className="small muted">
                      Pour relier cette relance à ton suivi, lance-la depuis la page <a href={href('/suivi')}>Suivi</a>.
                    </p>
                  )}

                  <div aria-live="polite">
                    {feedback && (
                      <Notice tone={feedback.tone}>
                        <p>{feedback.text}</p>
                      </Notice>
                    )}
                    {saveFailed && (
                      <Notice tone="warn">
                        <p>
                          Ton navigateur refuse l'enregistrement local (navigation privée ?). Exporte ton suivi pour le
                          garder.
                        </p>
                      </Notice>
                    )}
                  </div>

                  <p className="small muted">
                    Modèle indicatif, pas un conseil juridique. Relis la lettre avant de l'envoyer. Certains logiciels
                    de messagerie coupent les textes longs : si c'est le cas, utilise « Copier ». Garde une preuve de
                    l'envoi : le délai d'un mois court à partir de la réception.{' '}
                    <a href={href('/ressources')}>Comment l'envoyer</a>
                  </p>
                </div>
              </div>
              {stepNav}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
