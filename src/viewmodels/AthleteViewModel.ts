import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { AthleteOverview, AthleteStatsLine } from '../domain/usecases/GetAthleteOverviewUseCase';
import { formatStatValue, StatColumn } from '../domain/usecases/shared/tournamentStats';
import { StatScope } from '../domain/usecases/shared/statLeaders';
import { useLoadRequest } from './useLoadRequest';

const ATHLETE_ERROR = 'Não foi possível abrir o atleta. Tente novamente.';

export type AthleteStatsRow = { key: string; label: string; games: string; cells: string[] };

// A line read in one scope's columns, formatted the way the tournament stats
// screen formats the same keys.
export const athleteStatsRow = (line: AthleteStatsLine, columns: StatColumn[]): AthleteStatsRow => ({
  key: line.phaseId || 'total',
  label: line.label,
  games: formatStatValue('game_played', line.stats.game_played),
  cells: columns.map((column) => formatStatValue(column.key, line.stats[column.key])),
});

export const useAthleteViewModel = (tournamentId: string, playerId: string, apiBaseUrl?: string) => {
  const [overview, setOverview] = useState<AthleteOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request, refreshing, refreshError, retry, refresh, settleRefresh } = useLoadRequest(
    `${tournamentId}|${playerId}|${apiBaseUrl ?? ''}`
  );
  const [scope, setScope] = useState<StatScope>('aggregate');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!request.refresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await container.getAthleteOverview.execute(tournamentId, playerId, apiBaseUrl);
        if (!mounted) return;
        setOverview(next);
        // A refresh keeps the scope being read.
        if (request.refresh) settleRefresh(false);
        else setScope(next.scopes[0] ?? 'aggregate');
      } catch (requestError) {
        if (!mounted) return;
        // A failed refresh keeps the athlete on screen.
        if (request.refresh) {
          settleRefresh(true);
          return;
        }
        setOverview(null);
        setError(requestError instanceof AppError && requestError.status === 404 ? requestError.message : ATHLETE_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [tournamentId, playerId, apiBaseUrl, request, settleRefresh]);

  const columns = useMemo(() => overview?.columnsByScope[scope] ?? [], [overview, scope]);
  const rows = useMemo(() => (overview ? overview.rows.map((line) => athleteStatsRow(line, columns)) : []), [overview, columns]);
  const total = useMemo(() => (overview?.total ? athleteStatsRow(overview.total, columns) : null), [overview, columns]);

  const selectScope = useCallback((next: StatScope) => setScope(next), []);

  return {
    overview,
    loading,
    error,
    scope,
    scopes: overview?.scopes ?? [],
    columns,
    rows,
    total,
    selectScope,
    retry,
    refreshing,
    refreshError,
    refresh,
  };
};
