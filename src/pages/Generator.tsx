import { useId, useMemo, useState, type ChangeEvent } from 'react';
import { copyText, downloadText } from '../browser';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { formatLongFr, gdprDeadlines, isValidIsoDate, todayIso, type IsoDate } from '../lib/dates';
import {
  DATA_CATEGORIES,
  generateLetter,
  LetterInputError,
  letterToText,
  mailtoHref,
  type DataCategory,
  type InitialKind,
  type Letter,
  type LetterKind,
} from '../lib/letters';
import { slugify } from '../lib/slug';
import { newId } from '../lib/tracking';
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
}

const KIND_OPTIONS: { value: LetterKind; label: string; hint: string }[] = [
  { value: 'effacement', label: 'Effacement', hint: 'Article 17' },
  { value: 'acces', label: 'Accès', hint: 'Article 15' },
  { value: 'relance', label: 'Relance', hint: 'Après un mois' },
];

function asKind(value: string | null): LetterKind {
  return value === 'acces' || value === 'relance' ? value : 'effacement';
}

function initialState(route: Route): FormState {
  const q = route.query;
  const since = q.get('depuis') ?? '';
  return {
    kind: asKind(q.get('type')),
    fullName: '',
    email: '',
    postalAddress: '',
    siteName: q.get('site') ?? '',
    contact: '',
    urls: '',
    dataCategories: [],
    otherData: '',
    date: todayIso(),
    previousRequestDate: isValidIsoDate(since) ? since : '',
    previousKind: q.get('premiere') === 'acces' ? 'acces' : 'effacement',
  };
}

type Feedback = { tone: 'ok' | 'warn'; text: string } | null;

export function Generator({ route }: { route: Route }) {
  const [form, setForm] = useState<FormState>(() => initialState(route));
  const [feedback, setFeedback] = useState<Feedback>(null);
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
    if (!form.siteName.trim()) missing.push('le site concerné');
    if (form.kind === 'relance' && !isValidIsoDate(form.previousRequestDate))
      missing.push('la date de ta première demande');
    if (!isValidIsoDate(form.date)) missing.push('la date de la lettre');
    if (missing.length > 0) return { letter: null, missing };
    try {
      const letter = generateLetter({
        kind: form.kind,
        fullName: form.fullName,
        email: form.email,
        postalAddress: form.postalAddress,
        siteName: form.siteName,
        urls: form.urls.split('\n'),
        dataCategories: form.dataCategories,
        otherData: form.otherData,
        date: form.date,
        previousRequestDate: form.kind === 'relance' ? form.previousRequestDate : undefined,
        previousKind: form.kind === 'relance' ? form.previousKind : undefined,
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
    setFeedback(
      ok
        ? { tone: 'ok', text: 'Lettre copiée. Colle-la dans ton e-mail ou dans le formulaire du site.' }
        : { tone: 'warn', text: 'La copie a échoué. Sélectionne le texte de la lettre à la main.' },
    );
  };

  const onDownload = () => {
    if (!letter) return;
    downloadText(`shred-${form.kind}-${slugify(form.siteName)}.txt`, letterToText(letter));
  };

  const onTrack = () => {
    if (!letter) return;
    if (form.kind === 'relance') {
      if (!tracked) return;
      update((list) => list.map((r) => (r.id === tracked.id ? { ...r, status: 'relancee' } : r)));
      setFeedback({ tone: 'ok', text: 'La demande est marquée comme relancée dans ton suivi.' });
      return;
    }
    update((list) => [
      ...list,
      {
        id: newId(),
        site: form.siteName.trim(),
        kind: form.kind as InitialKind,
        channel: 'email',
        sentOn: form.date,
        status: 'envoyee',
        notes: '',
      },
    ]);
    setFeedback({
      tone: 'ok',
      text: `Ajoutée au suivi. Échéance de réponse : ${formatLongFr(gdprDeadlines(form.date).standard)}.`,
    });
  };

  const canTrack = form.kind !== 'relance' || Boolean(tracked);

  return (
    <>
      <PageHead eyebrow="Générateur" title="Écris ta lettre">
        Remplis le formulaire : la lettre se met à jour en direct. Rien n'est envoyé, rien n'est enregistré tant que tu
        ne l'ajoutes pas au suivi.
      </PageHead>

      <div className="container page-body">
        <div className="generator">
          <form className="generator__form" onSubmit={(event) => event.preventDefault()} noValidate>
            <section className="card" aria-labelledby={fieldId('t1')}>
              <h2 className="card__title" id={fieldId('t1')}>
                <span className="card__num">1</span>
                Type de demande
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
                      <option value="effacement">Effacement</option>
                      <option value="acces">Accès</option>
                    </select>
                  </div>
                </div>
              )}
            </section>

            <section className="card" aria-labelledby={fieldId('t2')}>
              <h2 className="card__title" id={fieldId('t2')}>
                <span className="card__num">2</span>
                Le site concerné
              </h2>
              <div className="field">
                <label htmlFor={fieldId('site')}>Nom ou adresse du site</label>
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
              <div className="field">
                <label htmlFor={fieldId('contact')}>
                  E-mail du DPO ou du responsable <span className="optional">(facultatif)</span>
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
                  Cherche-le dans les mentions légales ou la politique de confidentialité du site. Il sert seulement à
                  préremplir ton e-mail.
                </p>
              </div>
              <div className="field">
                <label htmlFor={fieldId('urls')}>
                  Pages où tes données apparaissent <span className="optional">(une par ligne)</span>
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

            <section className="card" aria-labelledby={fieldId('t3')}>
              <h2 className="card__title" id={fieldId('t3')}>
                <span className="card__num">3</span>
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
                  E-mail concerné par la fuite <span className="optional">(facultatif)</span>
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
                  Aide le site à retrouver tes données. N'ajoute pas de mot de passe.
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
                <input id={fieldId('date')} className="input" type="date" value={form.date} onChange={set('date')} />
              </div>
            </section>

            <Notice>
              <p>
                Ces champs restent dans cet onglet. Ton nom, ton e-mail et ton adresse ne sont jamais enregistrés, même
                dans le suivi.
              </p>
            </Notice>
          </form>

          <section className="generator__preview" aria-labelledby={fieldId('preview')}>
            <div className="preview-window">
              <div className="preview-bar">
                <h2 id={fieldId('preview')}>Aperçu en direct</h2>
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

              <article className="paper" aria-live="polite" aria-atomic="false">
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
                  </div>
                )}
              </article>

              <div className="preview-actions">
                {relanceTooEarly && (
                  <Notice tone="warn">
                    <p>
                      Le délai d'un mois court jusqu'au {formatLongFr(gdprDeadlines(form.previousRequestDate).standard)}{' '}
                      environ. Une relance avant cette date reste possible, mais elle a moins de poids.
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
                  Modèle indicatif, pas un conseil juridique. Relis la lettre avant de l'envoyer. Certains logiciels de
                  messagerie coupent les textes longs : si c'est le cas, utilise « Copier ».
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
