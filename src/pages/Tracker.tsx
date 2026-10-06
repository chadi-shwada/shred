import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { copyText, downloadText } from '../browser';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ExternalLink } from '../components/ExternalLink';
import { ShredBurst } from '../components/ShredBurst';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { CNIL_COMPLAINT_URL, cnilDossier, complaintSummary } from '../lib/complaint';
import { formatLongFr, isValidIsoDate, todayIso } from '../lib/dates';
import { buildIcs } from '../lib/ics';
import { slugify } from '../lib/slug';
import type { InitialKind } from '../lib/letters';
import {
  CHANNEL_LABELS,
  ImportError,
  KIND_LABELS,
  mergeRequests,
  newId,
  parseExport,
  serializeExport,
  sortRequests,
  stateOf,
  STATUS_LABELS,
  type Channel,
  type RequestState,
  type Status,
  type TrackedRequest,
  type Urgency,
} from '../lib/tracking';
import { href } from '../router';
import { useTracking } from '../useTracking';

const URGENCY_LABELS: Record<Urgency, string> = {
  depassee: 'Délai dépassé',
  bientot: 'Échéance proche',
  'en-cours': 'En attente',
  close: 'Close',
};

function urgencyText(state: RequestState): string {
  if (state.urgency === 'close') return URGENCY_LABELS.close;
  if (state.daysLeft < 0) {
    const days = -state.daysLeft;
    return `Dépassé de ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (state.daysLeft === 0) return "Échéance aujourd'hui";
  return `${state.daysLeft} jour${state.daysLeft > 1 ? 's' : ''} restant${state.daysLeft > 1 ? 's' : ''}`;
}

interface Draft {
  site: string;
  kind: InitialKind;
  channel: Channel;
  sentOn: string;
  notes: string;
}

const emptyDraft = (): Draft => ({ site: '', kind: 'effacement', channel: 'email', sentOn: todayIso(), notes: '' });

type Feedback = { tone: 'ok' | 'warn' | 'danger'; text: string } | null;

export function Tracker() {
  const { requests, update, saveFailed } = useTracking();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftError, setDraftError] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [complaintFor, setComplaintFor] = useState<string | null>(null);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const today = todayIso();
  const sorted = sortRequests(requests, today);
  const counts: Record<Urgency, number> = { depassee: 0, bientot: 0, 'en-cours': 0, close: 0 };
  for (const r of requests) counts[stateOf(r, today).urgency] += 1;
  const satisfied = requests.filter((r) => r.status === 'satisfaite').length;

  const setField =
    <K extends keyof Draft>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setDraft((d) => ({ ...d, [key]: event.target.value }));
      setDraftError('');
    };

  const onAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.site.trim()) {
      setDraftError('Indique le site concerné.');
      return;
    }
    if (!isValidIsoDate(draft.sentOn)) {
      setDraftError("Indique une date d'envoi valide.");
      return;
    }
    update((list) => [
      ...list,
      {
        id: newId(),
        site: draft.site.trim(),
        kind: draft.kind,
        channel: draft.channel,
        sentOn: draft.sentOn,
        status: 'envoyee',
        notes: draft.notes.trim(),
      },
    ]);
    setDraft(emptyDraft());
    setFeedback({ tone: 'ok', text: `Demande à ${draft.site.trim()} ajoutée.` });
  };

  /** Demande tout juste passée en « Satisfaite » : petite fête, rejouée à chaque fois. */
  const [celebrate, setCelebrate] = useState<{ id: string; n: number } | null>(null);

  const setStatus = (id: string, status: Status) => {
    update((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    if (status === 'satisfaite') setCelebrate((c) => ({ id, n: (c?.n ?? 0) + 1 }));
  };

  /** Suppression en attente de confirmation : une demande, ou tout le suivi. */
  const [pendingDelete, setPendingDelete] = useState<TrackedRequest | 'all' | null>(null);

  const remove = (request: TrackedRequest) => {
    update((list) => list.filter((r) => r.id !== request.id));
    setFeedback({ tone: 'ok', text: `Demande à ${request.site} supprimée.` });
  };

  const onReminder = (request: TrackedRequest, deadline: string) => {
    const ics = buildIcs({
      uid: request.id,
      date: deadline,
      summary: `Échéance RGPD : ${request.site}`,
      description: `Demande (${KIND_LABELS[request.kind].toLowerCase()}) envoyée le ${formatLongFr(request.sentOn)}. Sans réponse satisfaisante, prépare une relance depuis le suivi de Shred.`,
    });
    downloadText(`shred-echeance-${slugify(request.site)}.ics`, ics, 'text/calendar');
  };

  const onCopyComplaint = async (text: string) => {
    const ok = await copyText(text);
    setFeedback(
      ok
        ? { tone: 'ok', text: 'Récapitulatif copié. Colle-le dans le formulaire de plainte de la CNIL.' }
        : { tone: 'warn', text: 'La copie a échoué. Sélectionne le texte à la main.' },
    );
  };

  const onExport = () => {
    downloadText(`shred-suivi-${today}.json`, serializeExport(requests, today), 'application/json');
  };

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseExport(await file.text());
      update((list) => mergeRequests(list, imported));
      setFeedback({
        tone: 'ok',
        text: `${imported.length} demande${imported.length > 1 ? 's' : ''} importée${imported.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        text: error instanceof ImportError ? error.message : 'Impossible de lire ce fichier.',
      });
    }
  };

  const onClear = () => {
    update(() => []);
    setFeedback({ tone: 'ok', text: 'Suivi effacé.' });
  };

  const confirmDelete = () => {
    if (pendingDelete === 'all') onClear();
    else if (pendingDelete) remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <>
      <PageHead
        eyebrow="Suivi"
        command={{ input: 'shred suivi --echeances', output: 'délai légal : 1 mois (art. 12.3)' }}
        title="Tes demandes en cours"
      >
        Le site a un mois pour te répondre à compter de la réception (article 12.3 du RGPD), trois s'il t'a prévenu
        d'une prolongation. Le suivi reste dans ce navigateur.
      </PageHead>

      <div className="container page-body">
        <div className="stats" role="group" aria-label="Résumé">
          {(['depassee', 'bientot', 'en-cours', 'close'] as const).map((u) => (
            <div className={`stat stat--${u}`} key={u}>
              <span className="stat__label">{URGENCY_LABELS[u]}</span>
              <span className="stat__value">{counts[u]}</span>
            </div>
          ))}
        </div>

        <div className="tracker">
          <div className="tracker__side">
            <form className="card" onSubmit={onAdd} noValidate aria-labelledby={fieldId('addTitle')}>
              <h2 className="card__title" id={fieldId('addTitle')}>
                Ajouter une demande
              </h2>
              <div className="field">
                <label htmlFor={fieldId('site')}>Site</label>
                <input
                  id={fieldId('site')}
                  className="input"
                  value={draft.site}
                  onChange={setField('site')}
                  placeholder="exemple.com"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={draftError.startsWith('Indique le site') || undefined}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor={fieldId('kind')}>Type</label>
                  <select id={fieldId('kind')} className="select" value={draft.kind} onChange={setField('kind')}>
                    {(Object.keys(KIND_LABELS) as InitialKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={fieldId('channel')}>Canal</label>
                  <select
                    id={fieldId('channel')}
                    className="select"
                    value={draft.channel}
                    onChange={setField('channel')}
                  >
                    {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                      <option key={c} value={c}>
                        {CHANNEL_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor={fieldId('sentOn')}>Date d'envoi</label>
                <input
                  id={fieldId('sentOn')}
                  className="input"
                  type="date"
                  value={draft.sentOn}
                  onChange={setField('sentOn')}
                  aria-describedby={fieldId('sentOnHint')}
                />
                <p className="hint" id={fieldId('sentOnHint')}>
                  Pour un courrier recommandé, mets plutôt la date de réception indiquée sur l'avis.
                </p>
              </div>
              <div className="field">
                <label htmlFor={fieldId('notes')}>
                  Notes <span className="optional">(facultatif)</span>
                </label>
                <textarea
                  id={fieldId('notes')}
                  className="textarea"
                  value={draft.notes}
                  onChange={setField('notes')}
                  placeholder="N° de ticket, réponse reçue…"
                />
              </div>
              {draftError && (
                <p className="small" role="alert">
                  <strong>{draftError}</strong>
                </p>
              )}
              <button type="submit" className="btn btn--primary">
                <Icon name="plus" size={18} />
                Ajouter
              </button>
            </form>

            <div className="card">
              <h2 className="card__title">Sauvegarde</h2>
              <p className="small muted">
                Le suivi vit dans ce navigateur. Exporte-le pour le garder ou le transférer sur un autre appareil.
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn--sm" onClick={onExport} disabled={requests.length === 0}>
                  <Icon name="download" size={16} />
                  Exporter
                </button>
                <button type="button" className="btn btn--sm" onClick={() => fileInput.current?.click()}>
                  <Icon name="upload" size={16} />
                  Importer
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost btn--danger"
                  onClick={() => setPendingDelete('all')}
                  disabled={requests.length === 0}
                >
                  <Icon name="trash" size={16} />
                  Tout effacer
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onImport}
              />
            </div>
          </div>

          <section aria-labelledby={fieldId('listTitle')}>
            <div className="toolbar">
              <h2 id={fieldId('listTitle')}>
                {requests.length} demande{requests.length > 1 ? 's' : ''}
              </h2>
              <a className="btn btn--sm" href={href('/lettre')}>
                Écrire une lettre
              </a>
            </div>

            <div aria-live="polite" className="stack">
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

            {satisfied > 0 && (
              <div className="tracker-win">
                <span className="tracker-win__icon" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <p>
                  <strong>
                    {satisfied === 1
                      ? '1 entreprise a répondu favorablement'
                      : `${satisfied} entreprises ont répondu favorablement`}
                  </strong>
                  <span>Tu as fait respecter tes droits. Garde leur réponse avec ton suivi.</span>
                </p>
              </div>
            )}

            {sorted.length === 0 ? (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="database" />
                </span>
                <h2>Aucune demande pour l'instant</h2>
                <p>Ajoute une demande déjà envoyée, ou écris ta première lettre.</p>
                <a className="btn btn--primary" href={href('/lettre')}>
                  Écrire ma lettre
                </a>
              </div>
            ) : (
              <ul className="request-list">
                {sorted.map((request) => {
                  const state = stateOf(request, today);
                  return (
                    <li key={request.id} className="request" data-urgency={state.urgency} data-status={request.status}>
                      <div className="request__head">
                        <h3 className="request__site">{request.site}</h3>
                        <span className={`badge badge--${state.urgency}`}>{urgencyText(state)}</span>
                      </div>
                      <dl className="request__meta">
                        <div>
                          <dt>Type</dt>
                          <dd>{KIND_LABELS[request.kind]}</dd>
                        </div>
                        <div>
                          <dt>Canal</dt>
                          <dd>{CHANNEL_LABELS[request.channel]}</dd>
                        </div>
                        <div>
                          <dt>Envoyée le</dt>
                          <dd>{formatLongFr(request.sentOn)}</dd>
                        </div>
                        <div>
                          <dt>Échéance</dt>
                          <dd>{formatLongFr(state.deadline)}</dd>
                        </div>
                      </dl>
                      {request.status === 'satisfaite' && (
                        <p className="request__win">
                          <Icon name="check" size={18} />
                          Demande satisfaite, bravo !
                        </p>
                      )}
                      {celebrate?.id === request.id && <ShredBurst key={celebrate.n} tone="ok" />}
                      {request.notes && <p className="request__notes">{request.notes}</p>}
                      {request.letters && request.letters.length > 0 && (
                        <p className="hint request__letters">
                          {request.letters.length} lettre{request.letters.length > 1 ? 's' : ''} gardée
                          {request.letters.length > 1 ? 's' : ''} en copie pour le dossier CNIL
                        </p>
                      )}
                      <div className="request__controls">
                        <label className="visually-hidden" htmlFor={`${uid}-status-${request.id}`}>
                          Statut de la demande à {request.site}
                        </label>
                        <select
                          id={`${uid}-status-${request.id}`}
                          className="select"
                          value={request.status}
                          onChange={(event) => setStatus(request.id, event.target.value as Status)}
                        >
                          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        {state.urgency !== 'close' && (
                          <a
                            className="btn btn--sm"
                            href={href('/lettre', {
                              type: 'relance',
                              site: request.site,
                              depuis: request.sentOn,
                              premiere: request.kind,
                              suivi: request.id,
                              ...(request.context && { contexte: request.context }),
                            })}
                          >
                            Préparer une relance
                          </a>
                        )}
                        {state.urgency !== 'close' && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => onReminder(request, state.deadline)}
                            title="Ajoute l'échéance à ton agenda (fichier .ics)"
                          >
                            <Icon name="bell" size={16} />
                            Rappel
                          </button>
                        )}
                        {(state.urgency === 'depassee' || request.status === 'relancee') && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            aria-expanded={complaintFor === request.id}
                            onClick={() => setComplaintFor((id) => (id === request.id ? null : request.id))}
                          >
                            Plainte CNIL
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost btn--danger request__delete"
                          onClick={() => setPendingDelete(request)}
                          aria-label={`Supprimer la demande à ${request.site}`}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                      {complaintFor === request.id && (
                        <div className="complaint">
                          <p className="small">
                            Récapitulatif à coller dans le formulaire de la CNIL. Joins ta demande, ta relance et tes
                            preuves.
                          </p>
                          <textarea
                            className="textarea textarea--mono"
                            readOnly
                            rows={9}
                            value={complaintSummary(request, today)}
                            aria-label={`Récapitulatif de plainte pour ${request.site}`}
                          />
                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              onClick={() => onCopyComplaint(complaintSummary(request, today))}
                            >
                              <Icon name="copy" size={16} />
                              Copier
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() =>
                                downloadText(
                                  `shred-dossier-cnil-${slugify(request.site)}.txt`,
                                  cnilDossier(request, today),
                                )
                              }
                            >
                              <Icon name="download" size={16} />
                              Dossier complet
                            </button>
                            <ExternalLink href={CNIL_COMPLAINT_URL} className="btn btn--sm">
                              Adresser une plainte à la CNIL
                              <Icon name="external" size={16} />
                            </ExternalLink>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete === 'all' ? 'Effacer tout le suivi ?' : 'Supprimer cette demande ?'}
        confirmLabel={pendingDelete === 'all' ? 'Tout effacer' : 'Supprimer'}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete === 'all' ? (
          <p>
            Les {requests.length} demande{requests.length > 1 ? 's' : ''} de ce navigateur seront effacées. Exporte le
            suivi avant si tu veux le garder.
          </p>
        ) : pendingDelete ? (
          <p>
            La demande à <strong>{pendingDelete.site}</strong> sera retirée du suivi de ce navigateur. Ça n'annule pas
            la demande envoyée à l'entreprise.
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
