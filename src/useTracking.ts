import { useCallback, useState } from 'react';
import { todayIso } from './lib/dates';
import { loadRequests, saveRequests, type TrackedRequest } from './lib/tracking';

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Suivi des demandes persisté dans le localStorage de ce navigateur uniquement. */
export function useTracking() {
  const [requests, setRequests] = useState<TrackedRequest[]>(() => loadRequests(storage()));
  const [saveFailed, setSaveFailed] = useState(false);

  const update = useCallback(
    (next: (current: TrackedRequest[]) => TrackedRequest[]) => {
      const value = next(requests);
      setRequests(value);
      setSaveFailed(!saveRequests(storage(), value, todayIso()));
    },
    [requests],
  );

  return { requests, update, saveFailed };
}
