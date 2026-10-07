import { useId, useState } from 'react';
import { readStorage, writeStorage } from '../browser';
import { buildActionPlan, loadDone, PLAN_STORAGE_KEY } from '../lib/actionPlan';
import { Icon } from './Icon';

/** Plan d'action à cocher, adapté aux données exposées ; progression gardée dans le navigateur. */
export function ActionPlan({ dataClasses, write = true }: { dataClasses: string[]; write?: boolean }) {
  const id = useId();
  const [done, setDone] = useState<string[]>(() => loadDone(readStorage(PLAN_STORAGE_KEY)));
  const items = buildActionPlan(dataClasses, { write });
  if (items.length === 0) return null;
  const count = items.filter((i) => done.includes(i.id)).length;

  const toggle = (itemId: string) => {
    const next = done.includes(itemId) ? done.filter((d) => d !== itemId) : [...done, itemId];
    setDone(next);
    writeStorage(PLAN_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="plan">
      <div className="plan__head">
        <h3 id={`${id}-t`}>Ton plan d'action</h3>
        <span className="plan__count" aria-live="polite">
          {count} / {items.length} fait{count > 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="plan__bar"
        role="progressbar"
        aria-labelledby={`${id}-t`}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={count}
      >
        <span className="plan__fill" style={{ width: `${(count / items.length) * 100}%` }} />
      </div>
      <ul className="plan__list">
        {items.map((item) => (
          <li key={item.id} data-done={done.includes(item.id)}>
            <label className="plan__item">
              <input type="checkbox" checked={done.includes(item.id)} onChange={() => toggle(item.id)} />
              <span>
                <strong>{item.title}</strong>
                <span className="plan__detail">{item.detail}</span>
                {item.link && (
                  <a className="plan__link" href={item.link.href}>
                    {item.link.label}
                    <Icon name="arrow" size={14} />
                  </a>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="hint">Ta progression reste dans ce navigateur.</p>
    </div>
  );
}
