import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { useMyGamesViewModel } from '../MyGamesViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAthleteSchedules: { execute: jest.fn() },
  },
}));

const game = {
  id: 'g1',
  datetime: '2026-09-15T20:00:00Z',
  location: 'Ginásio',
  city: 'SP',
  court: '1',
  is_finished: false,
  live_state: null,
  home_score: null,
  away_score: null,
  home_team: { id: 't1', name: 'Casa' },
  away_team: { id: 't2', name: 'Fora' },
  tournament: { id: 'tr1', name: 'Copa', slug: 'copa' },
};

describe('useMyGamesViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not fetch when unauthenticated', async () => {
    const { result } = renderHook(() => useMyGamesViewModel(false));
    await waitFor(() => expect(result.current.needsAuth).toBe(true));
    expect(container.getAthleteSchedules.execute).not.toHaveBeenCalled();
  });

  it('loads schedules when authenticated', async () => {
    jest.mocked(container.getAthleteSchedules.execute).mockResolvedValue([game]);
    const { result } = renderHook(() => useMyGamesViewModel(true));
    await waitFor(() => expect(result.current.games).toEqual([game]));
  });

  it('flags missing athlete profile on 401', async () => {
    jest
      .mocked(container.getAthleteSchedules.execute)
      .mockRejectedValue(new AppError('Complete seu perfil de atleta para ver sua agenda.', 401));

    const { result } = renderHook(() => useMyGamesViewModel(true));
    await waitFor(() => expect(result.current.needsAthleteProfile).toBe(true));
    expect(result.current.games).toEqual([]);
  });

  it('surfaces generic schedule errors', async () => {
    jest.mocked(container.getAthleteSchedules.execute).mockRejectedValue(new AppError('agenda offline', 500));
    const { result } = renderHook(() => useMyGamesViewModel(true));
    await waitFor(() => expect(result.current.error).toBe('agenda offline'));
  });

  it('exposes refresh', async () => {
    jest.mocked(container.getAthleteSchedules.execute).mockResolvedValue([]);
    const { result } = renderHook(() => useMyGamesViewModel(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refresh();
    });
    expect(container.getAthleteSchedules.execute).toHaveBeenCalledTimes(2);
  });
});
