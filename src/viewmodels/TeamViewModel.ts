import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { TeamOverview } from '../domain/usecases/GetTeamOverviewUseCase';
import { BoxScoreSort, nextBoxScoreSort, sortedBoxScoreTeam } from '../domain/usecases/shared/boxScore';
import { StatScope } from '../domain/usecases/shared/statLeaders';
import { useLoadRequest } from './useLoadRequest';

const TEAM_ERROR = 'Não foi possível abrir o time. Tente novamente.';

export type TeamTabId = 'roster' | 'games';
export type TeamTab = { id: TeamTabId; label: string };

// A section with nothing in it earns no tab, which keeps the panels free of
// empty states — the public team page's rule.
export const teamTabs = (overview: TeamOverview): TeamTab[] => [
  ...(overview.roster.rows.length + overview.coaches.length > 0 ? [{ id: 'roster' as const, label: 'Elenco' }] : []),
  ...(overview.gameDays.length > 0 ? [{ id: 'games' as const, label: 'Jogos' }] : []),
];

const openingSort = (overview: TeamOverview, scope: StatScope): BoxScoreSort | null => {
  const slug = overview.roster.defaultSortByScope[scope];
  return slug ? { slug, direction: 'desc' } : null;
};

export const useTeamViewModel = (tournamentId: string, teamId: string, apiBaseUrl?: string) => {
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request, refreshing, refreshError, retry, refresh, settleRefresh } = useLoadRequest(
    `${tournamentId}|${teamId}|${apiBaseUrl ?? ''}`
  );
  const [requestedTab, setRequestedTab] = useState<TeamTabId | null>(null);
  const [scope, setScope] = useState<StatScope>('aggregate');
  const [sort, setSort] = useState<BoxScoreSort | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!request.refresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await container.getTeamOverview.execute(tournamentId, teamId, apiBaseUrl);
        if (!mounted) return;
        // A refresh keeps the tab, scope and ranking being read.
        if (request.refresh) {
          setOverview(next);
          settleRefresh(false);
          return;
        }
        const firstScope = next.roster.scopes[0];
        setOverview(next);
        setScope(firstScope);
        setSort(openingSort(next, firstScope));
      } catch (requestError) {
        if (!mounted) return;
        // A failed refresh keeps the team on screen.
        if (request.refresh) {
          settleRefresh(true);
          return;
        }
        setOverview(null);
        setError(requestError instanceof AppError && requestError.status === 404 ? requestError.message : TEAM_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [tournamentId, teamId, apiBaseUrl, request, settleRefresh]);

  const tabs = useMemo(() => (overview ? teamTabs(overview) : []), [overview]);
  const activeTab = tabs.find((tab) => tab.id === requestedTab)?.id ?? tabs[0]?.id ?? null;

  const columns = overview?.roster.columnsByScope[scope] ?? [];
  const totals = overview?.roster.totalsByScope[scope] ?? {};
  // The roster opens in its shirt-number order until a column ranks it.
  const rows = useMemo(
    () => (overview ? sortedBoxScoreTeam({ rows: overview.roster.rows, totals: {} }, sort).rows : []),
    [overview, sort]
  );

  // The per-game keys are their own, so a scope opens on its own default.
  const selectScope = useCallback(
    (next: StatScope) => {
      if (!overview) return;
      setScope(next);
      setSort(openingSort(overview, next));
    },
    [overview]
  );
  const sortBy = useCallback((slug: string) => setSort((current) => nextBoxScoreSort(current, slug)), []);
  const selectTab = useCallback((tab: TeamTabId) => setRequestedTab(tab), []);

  return {
    overview,
    loading,
    error,
    tabs,
    activeTab,
    scope,
    scopes: overview?.roster.scopes ?? [],
    columns,
    totals,
    rows,
    sort,
    selectTab,
    selectScope,
    sortBy,
    retry,
    refreshing,
    refreshError,
    refresh,
  };
};
