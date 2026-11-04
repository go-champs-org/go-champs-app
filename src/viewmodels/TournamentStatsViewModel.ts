import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { TournamentOverview } from '../domain/usecases/GetTournamentOverviewUseCase';
import { StatScope } from '../domain/usecases/shared/statLeaders';
import {
  defaultStatKey,
  initialStatsSelection,
  TournamentStatsRow,
  tournamentStatsLayout,
} from '../domain/usecases/shared/tournamentStats';

const TOURNAMENT_ERROR = 'Não foi possível abrir o campeonato. Tente novamente.';
const STATS_ERROR = 'Não foi possível carregar as estatísticas. Tente novamente.';

export type StatsFilters = {
  phaseId: string | null;
  teamId: string | null;
  // Keyed by stat slug; a stat with no minimum is absent, not zero.
  minStats: Record<string, number>;
};

export const NO_STATS_FILTERS: StatsFilters = { phaseId: null, teamId: null, minStats: {} };

type Selection = { scope: StatScope; statKey: string | null };

// The same object back when nothing changed, so a settled field reporting
// again doesn't ask for the ranking twice.
export const withMinimum = (minStats: Record<string, number>, slug: string, minimum: number | null) => {
  if ((minStats[slug] ?? null) === minimum) return minStats;
  const rest = { ...minStats };
  delete rest[slug];
  return minimum === null ? rest : { ...rest, [slug]: minimum };
};

export const useTournamentStatsViewModel = (tournamentId: string, requestedStatKey?: string, apiBaseUrl?: string) => {
  const [tournament, setTournament] = useState<TournamentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [filters, setFilters] = useState<StatsFilters>(NO_STATS_FILTERS);
  const [rows, setRows] = useState<TournamentStatsRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [rowsAttempt, setRowsAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const overview = await container.getTournamentOverview.execute(tournamentId, apiBaseUrl);
        if (!mounted) return;
        setTournament(overview);
        setSelection(initialStatsSelection(tournamentStatsLayout(overview), requestedStatKey));
      } catch {
        if (mounted) setError(TOURNAMENT_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [tournamentId, requestedStatKey, apiBaseUrl, attempt]);

  const layout = useMemo(() => (tournament ? tournamentStatsLayout(tournament) : null), [tournament]);

  // Every change of ranking or filter is a request of its own; one that
  // resolves after the next was asked for is dropped.
  useEffect(() => {
    if (!tournament || !selection) return;
    let current = true;
    const load = async () => {
      setRowsLoading(true);
      setRowsError(null);
      try {
        const ranking = await container.getTournamentStats.execute(
          tournament,
          { sort: selection.statKey, ...filters },
          apiBaseUrl
        );
        if (current) setRows(ranking);
      } catch {
        if (current) setRowsError(STATS_ERROR);
      } finally {
        if (current) setRowsLoading(false);
      }
    };
    void load();

    return () => {
      current = false;
    };
  }, [tournament, selection, filters, apiBaseUrl, rowsAttempt]);

  // A per-game key is its own column, so a scope opens on its own default.
  const selectScope = useCallback(
    (scope: StatScope) => layout && setSelection({ scope, statKey: defaultStatKey(layout, scope) }),
    [layout]
  );
  const selectStat = useCallback(
    (statKey: string) => setSelection((current) => (current && current.statKey !== statKey ? { ...current, statKey } : current)),
    []
  );
  const selectPhase = useCallback((phaseId: string | null) => setFilters((current) => ({ ...current, phaseId })), []);
  const selectTeam = useCallback((teamId: string | null) => setFilters((current) => ({ ...current, teamId })), []);
  const setMinStat = useCallback((slug: string, minimum: number | null) => setFilters((current) => {
    const minStats = withMinimum(current.minStats, slug, minimum);
    return minStats === current.minStats ? current : { ...current, minStats };
  }), []);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const retryRows = useCallback(() => setRowsAttempt((value) => value + 1), []);

  const activeFilterCount =
    Number(Boolean(filters.phaseId)) + Number(Boolean(filters.teamId)) + Object.keys(filters.minStats).length;

  return {
    tournament,
    loading,
    error,
    layout,
    scope: selection?.scope ?? null,
    statKey: selection?.statKey ?? null,
    columns: (selection && layout?.columnsByScope[selection.scope]) || [],
    filters,
    activeFilterCount,
    rows,
    rowsLoading,
    rowsError,
    selectScope,
    selectStat,
    selectPhase,
    selectTeam,
    setMinStat,
    retry,
    retryRows,
  };
};
