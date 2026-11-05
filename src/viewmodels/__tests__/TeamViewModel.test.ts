import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { TeamOverview } from '../../domain/usecases/GetTeamOverviewUseCase';
import { gamesFixture } from '../../test/fixtures/tournamentFixtures';
import { teamTabs, useTeamViewModel } from '../TeamViewModel';

jest.mock('../../di/container', () => ({
  container: { getTeamOverview: { execute: jest.fn() } },
}));

const getTeam = container.getTeamOverview.execute as jest.Mock;

const overview = (overrides: Partial<TeamOverview> = {}): TeamOverview => ({
  tournamentId: 't1',
  tournamentName: 'Liga',
  team: { id: 'team-a', name: 'Alpha', logoUrl: null, triCode: 'ALP' },
  coaches: [{ id: 'c1', name: 'Rui', label: 'Treinador principal' }],
  roster: {
    rows: [
      { playerId: 'p1', name: 'Ana', number: '4', stats: { points: '5', points_per_game: '5' } },
      { playerId: 'p2', name: 'Bia', number: '7', stats: { points: '20', points_per_game: '10' } },
    ],
    scopes: ['aggregate', 'per_game'],
    columnsByScope: {
      aggregate: [{ key: 'points', label: 'PTS', description: 'Pontos' }],
      per_game: [{ key: 'points_per_game', label: 'PTS', description: 'Pontos' }],
    },
    totalsByScope: { aggregate: { points: '25' }, per_game: {} },
    defaultSortByScope: { aggregate: 'points', per_game: null },
  },
  gameDays: [{ key: '2026-01-02', label: '2 de janeiro de 2026', games: gamesFixture }],
  ...overrides,
});

describe('teamTabs', () => {
  it('offers only the sections with something in them', () => {
    expect(teamTabs(overview())).toEqual([
      { id: 'roster', label: 'Elenco' },
      { id: 'games', label: 'Jogos' },
    ]);
    expect(teamTabs(overview({ gameDays: [] })).map((tab) => tab.id)).toEqual(['roster']);
    const noRoster = overview({ coaches: [], roster: { ...overview().roster, rows: [] } });
    expect(teamTabs(noRoster).map((tab) => tab.id)).toEqual(['games']);
    expect(teamTabs({ ...noRoster, gameDays: [] })).toEqual([]);
  });
});

describe('useTeamViewModel', () => {
  beforeEach(() => getTeam.mockReset());

  it('opens on the roster ranked by its default column', async () => {
    getTeam.mockResolvedValue(overview());
    const { result } = renderHook(() => useTeamViewModel('t1', 'team-a', 'https://api.test'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getTeam).toHaveBeenCalledWith('t1', 'team-a', 'https://api.test');
    expect(result.current.activeTab).toBe('roster');
    expect(result.current.scope).toBe('aggregate');
    expect(result.current.scopes).toEqual(['aggregate', 'per_game']);
    expect(result.current.sort).toEqual({ slug: 'points', direction: 'desc' });
    expect(result.current.rows.map((row) => row.name)).toEqual(['Bia', 'Ana']);
    expect(result.current.columns.map((column) => column.key)).toEqual(['points']);
    expect(result.current.totals).toEqual({ points: '25' });
  });

  it('turns a column around and opens another scope in roster order', async () => {
    getTeam.mockResolvedValue(overview());
    const { result } = renderHook(() => useTeamViewModel('t1', 'team-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.sortBy('points'));
    expect(result.current.sort).toEqual({ slug: 'points', direction: 'asc' });
    expect(result.current.rows.map((row) => row.name)).toEqual(['Ana', 'Bia']);

    act(() => result.current.selectScope('per_game'));
    expect(result.current.scope).toBe('per_game');
    expect(result.current.sort).toBeNull();
    expect(result.current.rows.map((row) => row.name)).toEqual(['Ana', 'Bia']);
    expect(result.current.totals).toEqual({});

    act(() => result.current.selectTab('games'));
    expect(result.current.activeTab).toBe('games');
  });

  it('falls back to the first tab when the requested one has nothing', async () => {
    getTeam.mockResolvedValue(overview({ gameDays: [] }));
    const { result } = renderHook(() => useTeamViewModel('t1', 'team-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectTab('games'));
    expect(result.current.activeTab).toBe('roster');
  });

  it('says a missing team is not found, and retries any other failure', async () => {
    getTeam.mockRejectedValueOnce(new AppError('Time não encontrado neste campeonato.', 404));
    const { result } = renderHook(() => useTeamViewModel('t1', 'team-z'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Time não encontrado neste campeonato.');
    expect(result.current.overview).toBeNull();
    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTab).toBeNull();
    expect(result.current.rows).toEqual([]);
    expect(result.current.columns).toEqual([]);

    act(() => result.current.selectScope('per_game'));
    expect(result.current.scope).toBe('aggregate');

    getTeam.mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBe('Não foi possível abrir o time. Tente novamente.'));

    getTeam.mockResolvedValueOnce(overview());
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.overview).not.toBeNull());
    expect(result.current.error).toBeNull();
  });

  it('drops a response that lands after unmount', async () => {
    let resolve: (value: TeamOverview) => void = () => undefined;
    getTeam.mockReturnValue(new Promise((done) => { resolve = done; }));
    const { result, unmount } = renderHook(() => useTeamViewModel('t1', 'team-a'));
    unmount();
    await act(async () => resolve(overview()));
    expect(result.current.overview).toBeNull();

    let reject: (error: Error) => void = () => undefined;
    getTeam.mockReturnValue(new Promise((_, fail) => { reject = fail; }));
    const second = renderHook(() => useTeamViewModel('t1', 'team-a'));
    second.unmount();
    await act(async () => reject(new Error('late')));
    expect(second.result.current.error).toBeNull();
  });
});
