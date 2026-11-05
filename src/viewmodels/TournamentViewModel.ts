import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { Game } from '../models/GameModel';
import { PhaseOverview } from '../domain/usecases/GetPhaseOverviewUseCase';
import { TournamentOverview } from '../domain/usecases/GetTournamentOverviewUseCase';
import { gameDateKey } from '../domain/usecases/shared/gameDateTime';
import { buildDateKeys, closestDateKey } from '../domain/usecases/shared/phasePresentation';
import { LeaderCard } from '../domain/usecases/shared/statLeaders';

export type TournamentView = 'home' | 'games';

const TOURNAMENT_ERROR = 'Não foi possível abrir o campeonato. Tente novamente.';
const PHASE_ERROR = 'Não foi possível carregar esta fase. Tente novamente.';

export const useTournamentViewModel = (tournamentId: string, initialPhaseId?: string, apiBaseUrl?: string) => {
  const [tournament, setTournament] = useState<TournamentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [leaders, setLeaders] = useState<LeaderCard[]>([]);
  const [requestedPhaseId, setRequestedPhaseId] = useState<string | null>(initialPhaseId ?? null);
  const [phase, setPhase] = useState<PhaseOverview | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [phaseAttempt, setPhaseAttempt] = useState(0);
  const [activeView, setActiveView] = useState<TournamentView>('home');
  const [requestedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setLeaders([]);
      try {
        const overview = await container.getTournamentOverview.execute(tournamentId, apiBaseUrl);
        if (!mounted) return;
        setTournament(overview);
        // Highlights are a companion: their failure leaves the card without them.
        container.getStatLeaders
          .execute(overview, apiBaseUrl)
          .then((cards) => mounted && setLeaders(cards))
          .catch(() => undefined);
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
  }, [tournamentId, apiBaseUrl, attempt]);

  const phases = useMemo(() => tournament?.phases ?? [], [tournament]);
  const selectedPhase = useMemo(
    () => phases.find((option) => option.id === requestedPhaseId) ?? phases.find((option) => option.id === tournament?.defaultPhaseId) ?? null,
    [phases, requestedPhaseId, tournament]
  );

  useEffect(() => {
    if (!tournament || !selectedPhase) return;
    let mounted = true;
    const load = async () => {
      setPhaseLoading(true);
      setPhaseError(null);
      setPhase(null);
      setSelectedDate(null);
      try {
        const overview = await container.getPhaseOverview.execute(selectedPhase.id, selectedPhase.kind, tournament.teams, apiBaseUrl);
        if (mounted) setPhase(overview);
      } catch {
        if (mounted) setPhaseError(PHASE_ERROR);
      } finally {
        if (mounted) setPhaseLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [tournament, selectedPhase, apiBaseUrl, phaseAttempt]);

  const games = useMemo(() => phase?.games ?? [], [phase]);
  const dateKeys = useMemo(() => buildDateKeys(games), [games]);
  const selectedDate = requestedDate && dateKeys.includes(requestedDate)
    ? requestedDate
    : closestDateKey(dateKeys, new Date());
  const gamesForSelectedDate = useMemo(
    () => (selectedDate ? games.filter((game) => gameDateKey(game.datetime) === selectedDate) : ([] as Game[])),
    [games, selectedDate]
  );

  const selectPhase = useCallback((phaseId: string) => setRequestedPhaseId(phaseId), []);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const retryPhase = useCallback(() => setPhaseAttempt((value) => value + 1), []);

  return {
    tournament,
    loading,
    error,
    leaders,
    phases,
    selectedPhase,
    phase,
    phaseLoading,
    phaseError,
    activeView,
    dateKeys,
    selectedDate,
    gamesForSelectedDate,
    selectPhase,
    setActiveView,
    setSelectedDate,
    retry,
    retryPhase,
  };
};
