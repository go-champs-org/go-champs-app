import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { container } from '../di/container';
import { AthleteRecentGame } from '../domain/repositories/AthleteProfileRepository';
import { AthleteGames } from '../domain/usecases/GetAthleteGamesUseCase';
import { gameShareCard } from '../domain/usecases/shared/gameShare';
import {
  DEFAULT_MY_GAMES_FILTER,
  effectiveTournamentId,
  filterMyGames,
  MyGamesFilter,
  myGamesTournaments,
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
  // Whether the last load found no athlete profile. A ref, so the callback
  // below stays stable and a focus effect keyed on it never loops.
  const missingProfile = useRef(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!username) {
        setGames(null);
        missingProfile.current = false;
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
        missingProfile.current = !next.profile;
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
        missingProfile.current = false;
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

  const selectTournament = useCallback((id: string | null) => setFilter({ tournamentId: id }), []);

  // The athlete profile may be created elsewhere (the Perfil tab) while this
  // tab stays mounted: when it comes back into view without one, load again.
  const recheckAthleteProfile = useCallback(() => {
    if (missingProfile.current) retry();
  }, [retry]);

  const profile = games?.profile ?? null;
  /** What goes on the "Compartilhar jogo" sticker of one result. */
  const shareCard = useCallback((recent: AthleteRecentGame) => gameShareCard(recent, profile), [profile]);

  return {
    loading,
    error,
    retry,
    refreshing,
    refreshError,
    refresh,
    needsAuth: !username,
    // Hidden while loading, so a recheck shows the loader, not the old prompt.
    needsAthleteProfile: Boolean(!loading && games && !games.profile),
    recheckAthleteProfile,
    now,
    tournamentId,
    tournaments,
    selectTournament,
    ...sections,
    hasGames: Boolean(sections.next || sections.previous.length),
    shareCard,
  };
};
