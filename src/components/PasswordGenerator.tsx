import { useId, useState } from 'react';
import { copyText } from '../browser';
import { entropyBits, generatePassword, type Charset } from '../lib/password';
import { Icon } from './Icon';

const SETS: { key: Charset; label: string }[] = [
  { key: 'minuscules', label: 'Minuscules' },
  { key: 'majuscules', label: 'Majuscules' },
  { key: 'chiffres', label: 'Chiffres' },
  { key: 'symboles', label: 'Symboles' },
];

/** Générateur de mot de passe, calculé dans le navigateur. Rien n'est enregistré. */
export function PasswordGenerator() {
  const id = useId();
  const [length, setLength] = useState(20);
  const [sets, setSets] = useState<Charset[]>(['minuscules', 'majuscules', 'chiffres', 'symboles']);
  const [password, setPassword] = useState(() => generatePassword(20));
  const [copied, setCopied] = useState(false);

  const regenerate = (nextLength = length, nextSets = sets) => {
    setPassword(generatePassword(nextLength, nextSets));
    setCopied(false);
  };

  const toggleSet = (key: Charset) => {
    const next = sets.includes(key) ? sets.filter((s) => s !== key) : [...sets, key];
    if (next.length === 0) return;
    setSets(next);
    regenerate(length, next);
  };

  const bits = entropyBits(length, sets);
  const strength = bits >= 100 ? 'très solide' : bits >= 75 ? 'solide' : bits >= 60 ? 'correct' : 'faible';

  return (
    <section className="card" aria-labelledby={`${id}-t`}>
      <h2 className="card__title" id={`${id}-t`}>
        <span className="card__num">
          <Icon name="lock" size={14} />
        </span>
        Crée un mot de passe solide
      </h2>
      <div className="generator-pw">
        <output className="generator-pw__value" aria-live="polite" htmlFor={`${id}-len`}>
          {password}
        </output>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={async () => setCopied(await copyText(password))}
          >
            <Icon name="copy" size={16} />
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button type="button" className="btn btn--sm" onClick={() => regenerate()}>
            Générer un autre
          </button>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-len`}>
          Longueur : {length} caractères{' '}
          <span className="optional">
            ({strength}, {bits} bits)
          </span>
        </label>
        <input
          id={`${id}-len`}
          type="range"
          min={12}
          max={40}
          value={length}
          onChange={(e) => {
            const next = Number(e.target.value);
            setLength(next);
            regenerate(next, sets);
          }}
        />
      </div>
      <fieldset>
        <legend className="legend">Caractères</legend>
        <div className="checks checks--compact">
          {SETS.map((s) => (
            <label className="check" key={s.key}>
              <input type="checkbox" checked={sets.includes(s.key)} onChange={() => toggleSet(s.key)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="hint">
        Calculé dans ton navigateur, jamais envoyé ni enregistré. Garde-le dans un gestionnaire de mots de passe.
      </p>
    </section>
  );
}
