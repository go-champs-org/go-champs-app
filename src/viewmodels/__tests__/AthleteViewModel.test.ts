import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { AthleteOverview } from '../../domain/usecases/GetAthleteOverviewUseCase';
import { deferred } from '../../test/deferred';
import { useAthleteViewModel } from '../AthleteViewModel';

jest.mock('../../di/container', () => ({
  container: { getAthleteOverview: { execute: jest.fn() } },
}));

const getAthlete = container.getAthleteOverview.execute as jest.Mock;

const overview = (overrides: Partial<AthleteOverview> = {}): AthleteOverview => ({
  tournamentId: 't1',
  tournamentName: 'Liga',
  athlete: { id: 'p1', name: 'Ana', photoUrl: null },
  team: { id: 'team-a', name: 'Alpha' },
  gamesText: '9 jogos disputados',
  socialLinks: [],
  scopes: ['aggregate', 'per_game'],
  columnsByScope: {
    aggregate: [{ key: 'points', label: 'PTS', description: 'Pontos' }],
    per_game: [{ key: 'points_per_game', label: 'PTS', description: 'Pontos' }],
  },
  rows: [{ phaseId: 'ph1', label: 'Temporada', stats: { game_played: 7, points: 307, points_per_game: 43.857 } }],
  total: { phaseId: '', label: 'Total', stats: { game_played: 9, points: 371, points_per_game: 41.222 } },
  hasStats: true,
  ...overrides,
});

describe('useAthleteViewModel', () => {
  beforeEach(() => getAthlete.mockReset());

  it('reads the API lines in the chosen scope', async () => {
    getAthlete.mockResolvedValue(overview());
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1', 'https://api.test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.total).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAthlete).toHaveBeenCalledWith('t1', 'p1', 'https://api.test');
    expect(result.current.scopes).toEqual(['aggregate', 'per_game']);
    expect(result.current.rows).toEqual([{ key: 'ph1', label: 'Temporada', games: '7', cells: ['307'] }]);
    expect(result.current.total).toEqual({ key: 'total', label: 'Total', games: '9', cells: ['371'] });

    act(() => result.current.selectScope('per_game'));
    expect(result.current.scope).toBe('per_game');
    expect(result.current.rows[0].cells).toEqual(['43.9']);
    expect(result.current.total?.cells).toEqual(['41.2']);
  });

  it('opens on the only scope a tournament has and has no total without stats', async () => {
    getAthlete.mockResolvedValue(overview({ scopes: ['per_game'], total: null, rows: [], hasStats: false }));
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scope).toBe('per_game');
    expect(result.current.total).toBeNull();
  });

  it('opens on the aggregate scope when the tournament has no columns', async () => {
    getAthlete.mockResolvedValue(overview({ scopes: [], columnsByScope: {} }));
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scope).toBe('aggregate');
    expect(result.current.columns).toEqual([]);
  });

  it('shows the not-found message and a generic one otherwise, then retries', async () => {
    getAthlete.mockRejectedValueOnce(new AppError('Atleta não encontrado neste campeonato.', 404));
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Atleta não encontrado neste campeonato.');
    expect(result.current.columns).toEqual([]);
    expect(result.current.scopes).toEqual([]);

    getAthlete.mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBe('Não foi possível abrir o atleta. Tente novamente.'));

    getAthlete.mockResolvedValueOnce(overview());
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.overview).not.toBeNull());
    expect(result.current.error).toBeNull();
  });

  it('ignores a response that lands after unmount', async () => {
    const pending = deferred<AthleteOverview>();
    const failing = deferred<AthleteOverview>();
    getAthlete.mockReturnValueOnce(pending.promise).mockReturnValueOnce(failing.promise);
    const first = renderHook(() => useAthleteViewModel('t1', 'p1'));
    const second = renderHook(() => useAthleteViewModel('t1', 'p2'));
    first.unmount();
    second.unmount();
    await act(async () => {
      pending.resolve(overview());
      failing.reject(new Error('late'));
      await Promise.resolve();
    });
    expect(first.result.current.overview).toBeNull();
    expect(second.result.current.error).toBeNull();
  });
});
