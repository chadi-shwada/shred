import { useId, useMemo, useState } from 'react';
import { copyText, downloadText } from '../browser';
import { DPO_CONTACTS } from '../data/contacts';
import type { Breach } from '../lib/breaches';
import { todayIso } from '../lib/dates';
import { breachLetterInput } from '../lib/letterLink';
import { generateLetter, letterToText, mailtoHref, INITIAL_KINDS, type InitialKind } from '../lib/letters';
import { newId, withLetter, type TrackedRequest } from '../lib/tracking';
import { useTracking } from '../useTracking';
import { ExternalLink } from './ExternalLink';
import { Icon } from './Icon';
import { Notice } from './Notice';

const KINDS: InitialKind[] = ['acces', 'effacement', 'fermeture'];

/** Une lettre par fuite cochée, en une fois, avec ajout groupé au suivi. */
export function BatchLetters({ breaches }: { breaches: Breach[] }) {
  const id = useId();
  const [kind, setKind] = useState<InitialKind>('acces');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [keepCopy, setKeepCopy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { update } = useTracking();
  const today = todayIso();

  const letters = useMemo(() => {
    if (!fullName.trim()) return [];
    return breaches.map((breach) => ({
      breach,
      letter: generateLetter(breachLetterInput(breach, kind, { fullName, email }, today)),
      contact: DPO_CONTACTS[breach.name],
    }));
  }, [breaches, kind, fullName, email, today]);

  const onDownloadAll = () => {
    const text = letters
      .map(({ breach, letter, contact }) =>
        [`===== ${breach.title}${contact ? ` (${contact.contact})` : ''} =====`, '', letterToText(letter)].join('\n'),
      )
      .join('\n\n');
    downloadText(`shred-lettres-${today}.txt`, text);
  };

  const onTrackAll = () => {
    update((list) => [
      ...list,
      ...letters.map(({ breach, letter }) => {
        const request: TrackedRequest = {
          id: newId(),
          site: breach.title,
          kind,
          channel: 'email',
          sentOn: today,
          status: 'envoyee',
          notes: `Fuite HIBP : ${breach.name}`,
        };
        return keepCopy ? withLetter(request, { date: today, subject: letter.subject, body: letter.body }) : request;
      }),
    ]);
    setFeedback(
      `${letters.length} demande${letters.length > 1 ? 's' : ''} ajoutée${letters.length > 1 ? 's' : ''} au suivi.`,
    );
  };

  return (
    <div className="batch">
      <h3>Écrire à toutes les entreprises</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-kind`}>Demande</label>
          <select
            id={`${id}-kind`}
            className="select"
            value={kind}
            onChange={(e) => setKind(e.target.value as InitialKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k === 'acces' ? 'Savoir ce qui a fuité (accès)' : INITIAL_KINDS[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-name`}>Ton nom complet</label>
          <input
            id={`${id}-name`}
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-email`}>
          E-mail concerné par les fuites <span className="optional">(facultatif)</span>
        </label>
        <input
          id={`${id}-email`}
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          spellCheck={false}
        />
      </div>

      {letters.length === 0 ? (
        <p className="hint">Indique ton nom pour préparer les {breaches.length} lettres.</p>
      ) : (
        <>
          <ul className="batch__list">
            {letters.map(({ breach, letter, contact }) => (
              <li key={breach.name}>
                <div>
                  <strong>{breach.title}</strong>
                  <span className="hint">
                    {contact ? (
                      <>
                        DPO : {contact.contact} · <ExternalLink href={contact.source}>source</ExternalLink>
                      </>
                    ) : (
                      'Contact à trouver dans sa politique de confidentialité'
                    )}
                  </span>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn btn--sm" onClick={() => copyText(letterToText(letter))}>
                    <Icon name="copy" size={16} />
                    Copier
                  </button>
                  <a
                    className="btn btn--sm"
                    href={mailtoHref(letter, contact?.kind === 'email' ? contact.contact : '')}
                  >
                    <Icon name="mail" size={16} />
                    Messagerie
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <label className="check">
            <input type="checkbox" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} />
            <span>
              Garder une copie des lettres dans le suivi, pour un éventuel dossier CNIL (elles contiennent ton nom et
              restent dans ce navigateur)
            </span>
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={onTrackAll}>
              <Icon name="plus" size={18} />
              Tout ajouter au suivi
            </button>
            <button type="button" className="btn" onClick={onDownloadAll}>
              <Icon name="download" size={18} />
              Tout télécharger
            </button>
          </div>
          <div aria-live="polite">
            {feedback && (
              <Notice tone="ok">
                <p>
                  {feedback} <a href="/suivi">Voir le suivi</a>
                </p>
              </Notice>
            )}
          </div>
        </>
      )}
    </div>
  );
}
