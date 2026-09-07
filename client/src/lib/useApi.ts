import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api.js';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** GET a path with loading/error state and a reload function. */
export function useApi<T>(path: string | null): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: !!path, error: null });

  const load = useCallback(() => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get<T>(path)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState({ data: null, loading: false, error: err instanceof ApiError ? err.message : 'Failed to load.' }),
      );
  }, [path]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
