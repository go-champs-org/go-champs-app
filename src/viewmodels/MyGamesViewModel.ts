import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { AthleteGames } from '../domain/usecases/GetAthleteGamesUseCase';
import {
  DEFAULT_MY_GAMES_FILTER,
  effectiveTournamentId,
  filterMyGames,
  MyGamesFilter,
  myGamesTournaments,
  MyGamesView,
} from '../domain/usecases/shared/myGames';
import { useLoadRequest } from './useLoadRequest';

export const MY_GAMES_ERROR = 'Não foi possível carregar seus jogos.';

const EMPTY = { teamGames: [], recentGames: [] };

/** Meus jogos: the athlete's next games and latest results, filtered locally. */
export const useMyGamesViewModel = (username: string | undefined) => {
  const [games, setGames] = useState<AthleteGames | null>(null);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MyGamesFilter>(DEFAULT_MY_GAMES_FILTER);
  // "Now" for what is upcoming, taken on each load, so a render never moves it.
  const [now, setNow] = useState(() => new Date());
  const { request, refreshing, refreshError, retry, refresh, settleRefresh } = useLoadRequest(username ?? '');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!username) {
        setGames(null);
        setError(null);
        setLoading(false);
        return;
      }
      if (!request.refresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await container.getAthleteGames.execute(username);
        if (!mounted) return;
        setGames(next);
        setNow(new Date());
        if (request.refresh) settleRefresh(false);
      } catch {
        if (!mounted) return;
        // A failed refresh keeps the games on screen.
        if (request.refresh) {
          settleRefresh(true);
          return;
        }
        setGames(null);
        setError(MY_GAMES_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [username, request, settleRefresh]);

  const data = games ?? EMPTY;
  const tournaments = useMemo(() => myGamesTournaments(data), [data]);
  const tournamentId = effectiveTournamentId(data, filter.tournamentId);
  const sections = useMemo(() => filterMyGames(data, filter, now), [data, filter, now]);

  const selectView = useCallback((view: MyGamesView) => setFilter((current) => ({ ...current, view })), []);
  const selectTournament = useCallback(
    (id: string | null) => setFilter((current) => ({ ...current, tournamentId: id })),
    []
  );

  return {
    loading,
    error,
    retry,
    refreshing,
    refreshError,
    refresh,
    needsAuth: !username,
    needsAthleteProfile: Boolean(games && !games.profile),
    now,
    view: filter.view,
    tournamentId,
    tournaments,
    selectView,
    selectTournament,
    ...sections,
    hasGames: Boolean(sections.next || sections.previous.length),
  };
};
