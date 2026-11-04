import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { TournamentOverview } from '../../domain/usecases/GetTournamentOverviewUseCase';
import { NO_STATS_FILTERS, useTournamentStatsViewModel, withMinimum } from '../TournamentStatsViewModel';
import { deferred } from '../../test/deferred';

jest.mock('../../di/container', () => ({ container: {
  getTournamentOverview: { execute: jest.fn() },
  getTournamentStats: { execute: jest.fn() },
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
  phases: [],
  defaultPhaseId: null,
  hasAggregatedPlayerStats: true,
  sportSlug: 'basketball_5x5',
  playerStats: [
    { slug: 'points', title: 'PTS' },
    { slug: 'assists', title: 'AST' },
    { slug: 'game_played', title: 'JOG' },
    { slug: 'points_per_game', title: 'PTS/J' },
  ],
};

const row = (playerId: string) => ({ playerId, name: playerId, photoUrl: null, team: null, stats: {} });

const tournamentExecute = container.getTournamentOverview.execute as jest.Mock;
const statsExecute = container.getTournamentStats.execute as jest.Mock;

const lastQuery = () => statsExecute.mock.calls[statsExecute.mock.calls.length - 1][1];

describe('useTournamentStatsViewModel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    tournamentExecute.mockResolvedValue(overview);
    statsExecute.mockResolvedValue([row('ana')]);
  });

  it('opens on the requested ranking and switches stat and scope', async () => {
    const { result } = renderHook(() => useTournamentStatsViewModel('t1', 'assists', 'https://api.test/v1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.rows).toEqual([row('ana')]));

    expect(tournamentExecute).toHaveBeenCalledWith('t1', 'https://api.test/v1');
    expect(statsExecute).toHaveBeenCalledWith(overview, { sort: 'assists', ...NO_STATS_FILTERS }, 'https://api.test/v1');
    expect([result.current.scope, result.current.statKey]).toEqual(['aggregate', 'assists']);
    expect(result.current.columns.map((column) => column.key)).toEqual(['game_played', 'points', 'assists']);

    act(() => result.current.selectStat('points'));
    await waitFor(() => expect(lastQuery().sort).toBe('points'));
    const calls = statsExecute.mock.calls.length;
    act(() => result.current.selectStat('points'));
    expect(statsExecute.mock.calls.length).toBe(calls);

    act(() => result.current.selectScope('per_game'));
    await waitFor(() => expect(lastQuery().sort).toBe('points_per_game'));
    expect(result.current.columns.map((column) => column.key)).toEqual(['points_per_game']);
    await waitFor(() => expect(result.current.rowsLoading).toBe(false));
  });

  it('narrows the ranking with filters', async () => {
    const { result } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(result.current.rows).toEqual([row('ana')]));
    expect(result.current.statKey).toBe('points');

    act(() => result.current.selectPhase('ph1'));
    act(() => result.current.selectTeam('team-a'));
    act(() => result.current.setMinStat('game_played', 3));
    await waitFor(() => expect(lastQuery()).toEqual({ sort: 'points', phaseId: 'ph1', teamId: 'team-a', minStats: { game_played: 3 } }));
    expect(result.current.activeFilterCount).toBe(3);

    const filters = result.current.filters;
    act(() => result.current.setMinStat('game_played', 3));
    expect(result.current.filters).toBe(filters);
    act(() => result.current.setMinStat('game_played', null));
    expect(result.current.filters.minStats).toEqual({});
  });

  it('keeps the latest ranking when an older one resolves late', async () => {
    const slow = deferred<ReturnType<typeof row>[]>();
    statsExecute.mockReturnValueOnce(slow.promise).mockResolvedValue([row('bia')]);
    const { result } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(statsExecute).toHaveBeenCalledTimes(1));

    act(() => result.current.selectStat('assists'));
    await waitFor(() => expect(result.current.rows).toEqual([row('bia')]));
    await act(async () => slow.resolve([row('ana')]));
    expect(result.current.rows).toEqual([row('bia')]);
  });

  it('reports a failed ranking and retries it', async () => {
    statsExecute.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(result.current.rowsError).toBe('Não foi possível carregar as estatísticas. Tente novamente.'));

    act(() => result.current.retryRows());
    await waitFor(() => expect(result.current.rows).toEqual([row('ana')]));
    expect(result.current.rowsError).toBeNull();
  });

  it('reports a tournament that fails to open and retries it', async () => {
    tournamentExecute.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(result.current.error).toBe('Não foi possível abrir o campeonato. Tente novamente.'));
    expect(result.current.columns).toEqual([]);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.tournament).toEqual(overview));
  });

  it('makes no request for a tournament without stats', async () => {
    tournamentExecute.mockResolvedValue({ ...overview, hasAggregatedPlayerStats: false });
    const { result, unmount } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.layout?.scopes).toEqual([]);
    expect(result.current.scope).toBeNull();
    expect(statsExecute).not.toHaveBeenCalled();
    unmount();
  });

  it('ignores a tournament that resolves after unmount', async () => {
    const late = deferred<TournamentOverview>();
    tournamentExecute.mockReturnValueOnce(late.promise);
    const { result, unmount } = renderHook(() => useTournamentStatsViewModel('t1'));
    unmount();
    await act(async () => late.resolve(overview));
    expect(result.current.tournament).toBeNull();

    const failing = deferred<TournamentOverview>();
    tournamentExecute.mockReturnValueOnce(failing.promise);
    const second = renderHook(() => useTournamentStatsViewModel('t1'));
    second.unmount();
    await act(async () => failing.reject(new Error('late')));
    expect(second.result.current.error).toBeNull();
  });

  it('drops a failed ranking that resolves after the next was asked for', async () => {
    const slow = deferred<ReturnType<typeof row>[]>();
    statsExecute.mockReturnValueOnce(slow.promise).mockResolvedValue([row('bia')]);
    const { result } = renderHook(() => useTournamentStatsViewModel('t1'));
    await waitFor(() => expect(statsExecute).toHaveBeenCalledTimes(1));
    act(() => result.current.selectStat('assists'));
    await waitFor(() => expect(result.current.rows).toEqual([row('bia')]));
    await act(async () => slow.reject(new Error('late')));
    expect(result.current.rowsError).toBeNull();
  });

  it('keeps the same minimums when nothing changed', () => {
    const minStats = { game_played: 2 };
    expect(withMinimum(minStats, 'game_played', 2)).toBe(minStats);
    expect(withMinimum(minStats, 'game_played', 4)).toEqual({ game_played: 4 });
    expect(withMinimum({}, 'game_played', null)).toEqual({});
  });
});
