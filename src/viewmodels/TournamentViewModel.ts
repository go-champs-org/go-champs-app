import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { Game } from '../models/GameModel';
import { PhaseOverview } from '../domain/usecases/GetPhaseOverviewUseCase';
import { TournamentOverview } from '../domain/usecases/GetTournamentOverviewUseCase';
import { gameDateKey } from '../domain/usecases/shared/gameDateTime';
import { buildDateKeys, closestDateKey } from '../domain/usecases/shared/phasePresentation';
import { LeaderCard } from '../domain/usecases/shared/statLeaders';
import { useLoadRequest } from './useLoadRequest';

export type TournamentView = 'home' | 'games';

const TOURNAMENT_ERROR = 'Não foi possível abrir o campeonato. Tente novamente.';
const PHASE_ERROR = 'Não foi possível carregar esta fase. Tente novamente.';

type RefreshContext = { phaseId: string | null };

// The phase on screen, with the tournament it was loaded for: a refresh
// replaces both together, so the phase effect knows not to load it again.
type LoadedPhase = { tournament: TournamentOverview; phaseId: string; overview: PhaseOverview };

// The requested phase while the tournament still has it, else its default.
const pickPhase = (tournament: TournamentOverview | null, phaseId: string | null) =>
  tournament?.phases.find((option) => option.id === phaseId)
  ?? tournament?.phases.find((option) => option.id === tournament.defaultPhaseId)
  ?? null;

// A companion request whose failure the refresh weighs on its own.
const settled = <T,>(promise: Promise<T>) => promise.then((value) => ({ value }), () => null);

export const useTournamentViewModel = (tournamentId: string, initialPhaseId?: string, apiBaseUrl?: string) => {
  const [tournament, setTournament] = useState<TournamentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requests = useLoadRequest<RefreshContext>(`${tournamentId}|${apiBaseUrl ?? ''}`);
  const { request, settleRefresh } = requests;
  const [leaders, setLeaders] = useState<LeaderCard[]>([]);
  const [requestedPhaseId, setRequestedPhaseId] = useState<string | null>(initialPhaseId ?? null);
  const [loadedPhase, setLoadedPhase] = useState<LoadedPhase | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [phaseAttempt, setPhaseAttempt] = useState(0);
  const [activeView, setActiveView] = useState<TournamentView>('home');
  const [requestedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Everything on screen is fetched again behind what is shown, and lands
    // together: the overview, the phase being read and the highlights.
    const refresh = async () => {
      try {
        const overview = await container.getTournamentOverview.execute(tournamentId, apiBaseUrl);
        const target = pickPhase(overview, request.context?.phaseId ?? null);
        const [phaseResult, cards] = await Promise.all([
          target
            ? settled(container.getPhaseOverview.execute(target.id, target.kind, overview.teams, apiBaseUrl))
            : Promise.resolve(null),
          settled(container.getStatLeaders.execute(overview, apiBaseUrl)),
        ]);
        if (!mounted) return;
        setTournament(overview);
        if (cards) setLeaders(cards.value);
        if (target && phaseResult) {
          setLoadedPhase({ tournament: overview, phaseId: target.id, overview: phaseResult.value });
          setPhaseError(null);
        } else if (target) {
          // A failed phase keeps the one on screen.
          setLoadedPhase((current) => (current?.phaseId === target.id ? { ...current, tournament: overview } : current));
        }
        settleRefresh(Boolean(target && !phaseResult));
      } catch {
        if (mounted) settleRefresh(true);
      }
    };
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
    void (request.refresh ? refresh() : load());

    return () => {
      mounted = false;
    };
  }, [tournamentId, apiBaseUrl, request, settleRefresh]);

  const phases = useMemo(() => tournament?.phases ?? [], [tournament]);
  const selectedPhase = useMemo(() => pickPhase(tournament, requestedPhaseId), [tournament, requestedPhaseId]);
  const phaseIsCurrent = Boolean(
    loadedPhase && selectedPhase && loadedPhase.tournament === tournament && loadedPhase.phaseId === selectedPhase.id
  );

  useEffect(() => {
    if (!tournament || !selectedPhase) return;
    let mounted = true;
    const load = async () => {
      // Already loaded, by a refresh or by this effect's last run. A phase
      // load the refresh overtook ends here too.
      if (phaseIsCurrent) {
        setPhaseLoading(false);
        return;
      }
      setPhaseLoading(true);
      setPhaseError(null);
      setLoadedPhase(null);
      setSelectedDate(null);
      try {
        const overview = await container.getPhaseOverview.execute(selectedPhase.id, selectedPhase.kind, tournament.teams, apiBaseUrl);
        if (mounted) setLoadedPhase({ tournament, phaseId: selectedPhase.id, overview });
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
  }, [tournament, selectedPhase, phaseIsCurrent, apiBaseUrl, phaseAttempt]);

  const phase = loadedPhase?.overview ?? null;
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
  const selectedPhaseId = selectedPhase?.id ?? null;
  const { refresh: requestRefresh } = requests;
  const refresh = useCallback(() => requestRefresh({ phaseId: selectedPhaseId }), [requestRefresh, selectedPhaseId]);
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
    retry: requests.retry,
    retryPhase,
    refreshing: requests.refreshing,
    refreshError: requests.refreshError,
    refresh,
  };
};
