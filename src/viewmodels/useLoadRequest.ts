import { useCallback, useState } from 'react';

export const REFRESH_ERROR = 'Não foi possível atualizar. Puxe a tela para tentar novamente.';

// One load of a screen's data. A refresh reloads it behind what is already on
// screen; any other load (the first one, a retry) shows the full loading state.
// `context` carries what the refresh needs to know about the screen at the
// moment it was asked for, such as the phase being shown.
export type LoadRequest<C = undefined> = {
  key: string;
  id: number;
  refresh: boolean;
  context?: C;
};

// Viewmodels key their load effect on `request` and read `request.refresh` to
// decide between a full load and a background one, which ends with
// `settleRefresh`. `key` names the data: when it changes, the next load is a
// full one, never a pending refresh of the previous data.
export const useLoadRequest = <C = undefined>(key: string) => {
  const [request, setRequest] = useState<LoadRequest<C>>({ key, id: 0, refresh: false });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  if (request.key !== key) {
    setRequest({ key, id: 0, refresh: false });
    setRefreshing(false);
    setRefreshError(null);
  }

  const retry = useCallback(() => {
    setRefreshError(null);
    setRequest((current) => ({ key: current.key, id: current.id + 1, refresh: false }));
  }, []);

  // Set from the gesture itself, so the spinner never waits for the effect.
  const refresh = useCallback((context?: C) => {
    setRefreshing(true);
    setRefreshError(null);
    setRequest((current) => ({ key: current.key, id: current.id + 1, refresh: true, context }));
  }, []);

  const settleRefresh = useCallback((failed: boolean) => {
    setRefreshing(false);
    setRefreshError(failed ? REFRESH_ERROR : null);
  }, []);

  return { request, refreshing, refreshError, retry, refresh, settleRefresh };
};
