import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { AthleteOverview } from '../domain/usecases/GetAthleteOverviewUseCase';
import { PhaseStatRow, phaseCellValue } from '../domain/usecases/shared/athleteProfile';
import { StatColumn } from '../domain/usecases/shared/tournamentStats';
import { StatScope } from '../domain/usecases/shared/statLeaders';

const ATHLETE_ERROR = 'Não foi possível abrir o atleta. Tente novamente.';

// Both scopes are always offered: they read the same games, one as totals
// and one divided by the games played.
export const ATHLETE_SCOPES: StatScope[] = ['aggregate', 'per_game'];

export type AthleteStatsRow = { key: string; label: string; games: string; cells: string[] };

export const athleteStatsRow = (row: PhaseStatRow, columns: StatColumn[], scope: StatScope): AthleteStatsRow => ({
  key: row.phaseId || 'total',
  label: row.label,
  games: String(row.games),
  cells: columns.map((column) => phaseCellValue(column.key, row, scope)),
});

export const useAthleteViewModel = (tournamentId: string, playerId: string, apiBaseUrl?: string) => {
  const [overview, setOverview] = useState<AthleteOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [scope, setScope] = useState<StatScope>('aggregate');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await container.getAthleteOverview.execute(tournamentId, playerId, apiBaseUrl);
        if (!mounted) return;
        setOverview(next);
      } catch (requestError) {
        if (!mounted) return;
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
  }, [tournamentId, playerId, apiBaseUrl, attempt]);

  const rows = useMemo(
    () => (overview ? overview.table.rows.map((row) => athleteStatsRow(row, overview.columns, scope)) : []),
    [overview, scope]
  );
  const total = useMemo(
    () => (overview ? athleteStatsRow(overview.table.total, overview.columns, scope) : null),
    [overview, scope]
  );

  const selectScope = useCallback((next: StatScope) => setScope(next), []);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    overview,
    loading,
    error,
    scope,
    scopes: ATHLETE_SCOPES,
    columns: overview?.columns ?? [],
    rows,
    total,
    selectScope,
    retry,
  };
};
