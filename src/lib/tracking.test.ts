import { describe, expect, it } from 'vitest';
import {
  deadlineOf,
  ImportError,
  loadRequests,
  mergeRequests,
  parseExport,
  saveRequests,
  serializeExport,
  sortRequests,
  stateOf,
  STORAGE_KEY,
  withLetter,
  type TrackedRequest,
} from './tracking';

const req = (over: Partial<TrackedRequest> = {}): TrackedRequest => ({
  id: 'a',
  site: 'exemple.test',
  kind: 'effacement',
  channel: 'email',
  sentOn: '2026-09-01',
  status: 'envoyee',
  notes: '',
  ...over,
});

describe('échéances', () => {
  it('un mois après l’envoi, trois si le délai est prolongé', () => {
    expect(deadlineOf(req())).toBe('2026-10-01');
    expect(deadlineOf(req({ status: 'prolongee' }))).toBe('2026-12-01');
  });

  it('classe l’urgence', () => {
    expect(stateOf(req(), '2026-09-10').urgency).toBe('en-cours');
    expect(stateOf(req(), '2026-09-24').urgency).toBe('bientot');
    expect(stateOf(req(), '2026-10-01')).toEqual({ deadline: '2026-10-01', daysLeft: 0, urgency: 'bientot' });
    expect(stateOf(req(), '2026-10-02').urgency).toBe('depassee');
    expect(stateOf(req({ status: 'satisfaite' }), '2027-01-01').urgency).toBe('close');
  });

  it('trie les demandes dépassées en premier', () => {
    const list = [
      req({ id: 'close', status: 'refusee', sentOn: '2026-01-01' }),
      req({ id: 'loin', sentOn: '2026-10-01' }),
      req({ id: 'retard', sentOn: '2026-08-01' }),
    ];
    expect(sortRequests(list, '2026-10-05').map((r) => r.id)).toEqual(['retard', 'loin', 'close']);
  });
});

describe('export et import', () => {
  it('fait un aller-retour sans perte', () => {
    const list = [
      req(),
      req({ id: 'b', kind: 'acces', channel: 'courrier', notes: 'AR n° 1A' }),
      req({ id: 'c', kind: 'opposition' }),
      req({ id: 'd', kind: 'fermeture' }),
    ];
    expect(parseExport(serializeExport(list, '2026-10-05'))).toEqual(list);
  });

  it('refuse un fichier étranger ou abîmé', () => {
    expect(() => parseExport('pas du json')).toThrow(ImportError);
    expect(() => parseExport('{"format":"autre"}')).toThrow("n'est pas un export de suivi Shred");
    expect(() => parseExport('{"format":"shred-suivi","version":2,"requests":[]}')).toThrow('Version');
  });

  it('indique la demande fautive', () => {
    const bad = JSON.stringify({
      format: 'shred-suivi',
      version: 1,
      requests: [req(), { ...req(), id: 'b', sentOn: '2026-02-30' }],
    });
    expect(() => parseExport(bad)).toThrow("Demande n° 2 : date d'envoi invalide.");
  });

  it('refuse les identifiants en double', () => {
    const dup = JSON.stringify({ format: 'shred-suivi', version: 1, requests: [req(), req()] });
    expect(() => parseExport(dup)).toThrow('double');
  });

  it('fusionne en remplaçant les mêmes identifiants', () => {
    const merged = mergeRequests([req(), req({ id: 'b' })], [req({ status: 'satisfaite' }), req({ id: 'c' })]);
    expect(merged.map((r) => `${r.id}:${r.status}`)).toEqual(['a:satisfaite', 'b:envoyee', 'c:envoyee']);
  });
});

describe('stockage local', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      data,
    };
  };

  it('enregistre puis relit', () => {
    const storage = memory();
    expect(saveRequests(storage, [req()], '2026-10-05')).toBe(true);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(loadRequests(storage)).toEqual([req()]);
  });

  it('survit à un stockage absent, corrompu ou qui refuse l’écriture', () => {
    expect(loadRequests(undefined)).toEqual([]);
    const corrupted = memory();
    corrupted.setItem(STORAGE_KEY, '{oups');
    expect(loadRequests(corrupted)).toEqual([]);
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(saveRequests(full, [req()], '2026-10-05')).toBe(false);
  });
});

describe('copies des lettres', () => {
  it('fait un aller-retour avec les lettres et ignore celles abîmées', () => {
    const withCopies = withLetter(req(), { date: '2026-09-01', subject: 'Objet', body: 'Corps' });
    const raw = JSON.parse(serializeExport([withCopies], '2026-10-05'));
    raw.requests[0].letters.push({ date: 'hier', subject: 'x', body: 'y' });
    expect(parseExport(JSON.stringify(raw))[0]?.letters).toEqual([
      { date: '2026-09-01', subject: 'Objet', body: 'Corps' },
    ]);
  });

  it('reste compatible avec les exports sans lettres', () => {
    expect(parseExport(serializeExport([req()], '2026-10-05'))[0]).not.toHaveProperty('letters');
  });
});
