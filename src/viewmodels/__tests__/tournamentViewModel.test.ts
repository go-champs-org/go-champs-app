import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { useTournamentViewModel } from '../TournamentViewModel';
import { TournamentOverview } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { PhaseOverview } from '../../domain/usecases/GetPhaseOverviewUseCase';
import { gamesFixture } from '../../test/fixtures/tournamentFixtures';
import { deferred } from '../../test/deferred';

jest.mock('../../di/container', () => ({ container: {
  getTournamentOverview: { execute: jest.fn() },
  getPhaseOverview: { execute: jest.fn() },
  getStatLeaders: { execute: jest.fn() },
} }));

const overview: TournamentOverview = {
  id: 't1',
  name: 'Copa',
  slug: 'copa',
  logoUrl: null,
  organizationName: 'Org',
  organizationSlug: 'org',
  isActive: true,
  teams: [{ id: 'team-a', name: 'Alpha', logo_url: null, tri_code: null }],
  players: [],
  phases: [
    { id: 'table', title: 'Classificação', order: 1, isInProgress: false, kind: 'standings' },
    { id: 'draw', title: 'Playoffs', order: 2, isInProgress: true, kind: 'bracket' },
  ],
  defaultPhaseId: 'draw',
  hasAggregatedPlayerStats: true,
  sportSlug: 'basketball_5x5',
  playerStats: [],
};

const standings: PhaseOverview = { kind: 'standings', columns: [], groups: [], games: gamesFixture, teamMap: {} };
const bracket: PhaseOverview = { kind: 'bracket', draws: [], games: [], teamMap: {} };
const leaders = [{ slug: 'points', title: 'Pontos', scopes: [] }];

const tournamentExecute = container.getTournamentOverview.execute as jest.Mock;
const phaseExecute = container.getPhaseOverview.execute as jest.Mock;
const leadersExecute = container.getStatLeaders.execute as jest.Mock;

describe('useTournamentViewModel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    tournamentExecute.mockResolvedValue(overview);
    leadersExecute.mockResolvedValue(leaders);
    phaseExecute.mockImplementation((phaseId: string) => Promise.resolve(phaseId === 'table' ? standings : bracket));
  });

  it('opens the default phase, loads highlights and switches phase', async () => {
    const { result } = renderHook(() => useTournamentViewModel('t1', undefined, 'https://api.test/v1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.phase).toEqual(bracket));

    expect(tournamentExecute).toHaveBeenCalledWith('t1', 'https://api.test/v1');
    expect(phaseExecute).toHaveBeenCalledWith('draw', 'bracket', overview.teams, 'https://api.test/v1');
    expect(result.current.selectedPhase?.id).toBe('draw');
    expect(result.current.leaders).toEqual(leaders);
    expect(result.current.selectedDate).toBeNull();

    act(() => result.current.selectPhase('table'));
    await waitFor(() => expect(result.current.phase).toEqual(standings));
    expect(result.current.selectedPhase?.id).toBe('table');
  });

  it('honours a requested phase and navigates games by date', async () => {
    const { result } = renderHook(() => useTournamentViewModel('t1', 'table'));
    await waitFor(() => expect(result.current.phase).toEqual(standings));

    expect(result.current.dateKeys).toEqual(['2026-01-01', '2026-01-02']);
    act(() => {
      result.current.setActiveView('games');
      result.current.setSelectedDate('2026-01-01');
    });
    expect(result.current.activeView).toBe('games');
    expect(result.current.gamesForSelectedDate.map((game) => game.id)).toEqual(['game-1']);
    act(() => result.current.setSelectedDate('1999-01-01'));
    expect(result.current.selectedDate).not.toBe('1999-01-01');
  });

  it('falls back to the default phase when the requested one is unknown', async () => {
    const { result } = renderHook(() => useTournamentViewModel('t1', 'gone'));
    await waitFor(() => expect(result.current.phase).toEqual(bracket));
    expect(result.current.selectedPhase?.id).toBe('draw');
  });

  it('keeps the tournament when highlights fail and loads nothing without phases', async () => {
    leadersExecute.mockRejectedValue(new Error('offline'));
    tournamentExecute.mockResolvedValue({ ...overview, phases: [], defaultPhaseId: null });
    const { result } = renderHook(() => useTournamentViewModel('t1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournament?.id).toBe('t1');
    expect(result.current.leaders).toEqual([]);
    expect(result.current.selectedPhase).toBeNull();
    expect(phaseExecute).not.toHaveBeenCalled();
  });

  it('explains a failed opening and recovers on retry', async () => {
    tournamentExecute.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useTournamentViewModel('t1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Não foi possível abrir o campeonato. Tente novamente.');
    expect(result.current.tournament).toBeNull();

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.phase).toEqual(bracket));
    expect(result.current.error).toBeNull();
  });

  it('explains a failed phase and recovers on retry', async () => {
    phaseExecute.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useTournamentViewModel('t1'));
    await waitFor(() => expect(result.current.phaseError).toBe('Não foi possível carregar esta fase. Tente novamente.'));
    expect(result.current.phaseLoading).toBe(false);

    act(() => result.current.retryPhase());
    await waitFor(() => expect(result.current.phase).toEqual(bracket));
    expect(result.current.phaseError).toBeNull();
  });

  it.each(['resolve', 'reject'] as const)('ignores a stale tournament that will %s after leaving', async (settle) => {
    const stale = deferred<TournamentOverview>();
    tournamentExecute.mockReturnValueOnce(stale.promise);
    const { result, unmount } = renderHook(() => useTournamentViewModel('t1'));
    unmount();
    await act(async () => {
      if (settle === 'resolve') stale.resolve(overview);
      else stale.reject(new Error('old'));
    });
    expect(result.current.tournament).toBeNull();
    expect(phaseExecute).not.toHaveBeenCalled();
  });

  it.each(['resolve', 'reject'] as const)('ignores a stale phase that will %s after switching', async (settle) => {
    const stale = deferred<PhaseOverview>();
    phaseExecute.mockReturnValueOnce(stale.promise).mockResolvedValue(standings);
    const stalePhase = deferred<typeof leaders>();
    leadersExecute.mockReturnValueOnce(stalePhase.promise);
    const { result, unmount } = renderHook(() => useTournamentViewModel('t1'));
    await waitFor(() => expect(result.current.selectedPhase?.id).toBe('draw'));
    act(() => result.current.selectPhase('table'));
    await waitFor(() => expect(result.current.phase).toEqual(standings));
    await act(async () => {
      if (settle === 'resolve') stale.resolve(bracket);
      else stale.reject(new Error('old'));
    });
    expect(result.current.phase).toEqual(standings);
    expect(result.current.phaseError).toBeNull();
    unmount();
    await act(async () => stalePhase.resolve(leaders));
    expect(result.current.leaders).toEqual([]);
  });
});
