import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { useGameDetailViewModel } from '../GameDetailViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getGameOverview: { execute: jest.fn() },
  },
}));

const overview = {
  game: {
    id: 'game-1',
    phase_id: 'p1',
    datetime: '2026-01-01T10:00:00.000Z',
    location: 'Court 1',
    city: null,
    court: null,
    number: null,
    result_type: null,
    home_score: 10,
    away_score: 8,
    home_placeholder: null,
    away_placeholder: null,
    is_finished: true,
    live_state: 'ended',
    live_started_at: null,
    live_ended_at: null,
    youtube_code: null,
    info: null,
    assets: [],
    officials: [],
    web_url: null,
    home_team: { id: 'a', name: 'Alpha', logo_url: null, tri_code: 'A', players: [] },
    away_team: { id: 'b', name: 'Beta', logo_url: null, tri_code: 'B', players: [] },
  },
  boxScore: [],
};

describe('useGameDetailViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads game overview', async () => {
    jest.mocked(container.getGameOverview.execute).mockResolvedValue(overview as never);
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game?.id).toBe('game-1');
    expect(result.current.error).toBeNull();
  });

  it('surfaces errors', async () => {
    jest.mocked(container.getGameOverview.execute).mockRejectedValue(new AppError('falhou', 500));
    const { result } = renderHook(() => useGameDetailViewModel('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('falhou');
    expect(result.current.game).toBeNull();
  });

  it('uses fallback message for unknown errors', async () => {
    jest.mocked(container.getGameOverview.execute).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useGameDetailViewModel('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Não foi possível carregar o detalhe do jogo.');
  });

  it('refreshes on demand', async () => {
    jest.mocked(container.getGameOverview.execute).mockResolvedValue(overview as never);
    const { result } = renderHook(() => useGameDetailViewModel('game-1', 'https://api.example/v1'));
    await waitFor(() => expect(result.current.game).not.toBeNull());
    await act(async () => {
      await result.current.refresh();
    });
    expect(container.getGameOverview.execute).toHaveBeenCalledWith('game-1', 'https://api.example/v1');
  });
});
