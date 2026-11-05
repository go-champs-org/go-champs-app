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

const overview = (): AthleteOverview => ({
  tournamentId: 't1',
  tournamentName: 'Liga',
  athlete: { id: 'p1', name: 'Ana', photoUrl: null },
  team: { id: 'team-a', name: 'Alpha' },
  gamesText: '4 jogos disputados',
  socialLinks: [],
  columns: [{ key: 'points', label: 'PTS', description: 'Pontos' }],
  table: {
    rows: [{ phaseId: 'ph1', label: 'Grupos', games: 4, sums: { points: 30 }, counts: { points: 4 } }],
    total: { phaseId: '', label: 'Total', games: 4, sums: { points: 30 }, counts: { points: 4 } },
  },
  hasStats: true,
});

describe('useAthleteViewModel', () => {
  beforeEach(() => getAthlete.mockReset());

  it('loads the athlete and reads the table in the chosen scope', async () => {
    getAthlete.mockResolvedValue(overview());
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1', 'https://api.test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.total).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAthlete).toHaveBeenCalledWith('t1', 'p1', 'https://api.test');
    expect(result.current.scopes).toEqual(['aggregate', 'per_game']);
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.rows).toEqual([{ key: 'ph1', label: 'Grupos', games: '4', cells: ['30'] }]);
    expect(result.current.total).toEqual({ key: 'total', label: 'Total', games: '4', cells: ['30'] });

    act(() => result.current.selectScope('per_game'));
    expect(result.current.scope).toBe('per_game');
    expect(result.current.rows[0].cells).toEqual(['7.5']);
  });

  it('shows the not-found message and a generic one otherwise, then retries', async () => {
    getAthlete.mockRejectedValueOnce(new AppError('Atleta não encontrado neste campeonato.', 404));
    const { result } = renderHook(() => useAthleteViewModel('t1', 'p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Atleta não encontrado neste campeonato.');
    expect(result.current.columns).toEqual([]);

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
