import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { useGameDetailViewModel } from '../GameDetailViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getGameOverview: { execute: jest.fn() },
    getLiveScore: { execute: jest.fn() },
  },
}));

const getOverview = container.getGameOverview.execute as jest.Mock;
const getLive = container.getLiveScore.execute as jest.Mock;

const game = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

const row = (playerId: string, stats: Record<string, string>, photoUrl = '') => ({ playerId, name: playerId, photoUrl, stats });

const boxScore = {
  columns: [{ slug: 'points', label: 'PTS', description: 'Pontos' }],
  ranking: ['points'],
  home: { teamId: 'a', teamName: 'Alpha', logoUrl: null, rows: [row('a1', { points: '2' }, 'photo-a1'), row('a2', { points: '9' })], totals: { points: '11' } },
  away: { teamId: 'b', teamName: 'Beta', logoUrl: null, rows: [row('b1', { points: '4' })], totals: { points: '4' } },
};

const overview = (gameOverrides: Record<string, unknown> = {}, rest: Record<string, unknown> = {}) => ({
  game: game(gameOverrides),
  sportSlug: 'basketball_5x5',
  liveSiteUpdate: null,
  boxScore,
  ...rest,
});

const liveUpdate = (ended = false) => ({
  score: { homeScore: 21, awayScore: 19 },
  ended,
  period: { type: 'quarter', number: 3 },
  timeLeft: '04:10',
  boxScore: {
    home: { rows: [row('a1', { points: '15' }), row('a3', { points: '6' })], totals: { points: '21' } },
    away: { rows: [row('b1', { points: '19' })], totals: { points: '19' } },
  },
});

describe('useGameDetailViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads a finished game with its saved, ranked box score and no live feed', async () => {
    getOverview.mockResolvedValue(overview());
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game?.id).toBe('game-1');
    expect(result.current.error).toBeNull();
    expect(result.current.isLive).toBe(false);
    expect(result.current.score).toEqual({ homeScore: 10, awayScore: 8 });
    expect(result.current.periodLabel).toBeNull();
    expect(result.current.boxScore?.home.rows.map((item) => item.playerId)).toEqual(['a2', 'a1']);
    expect(getLive).not.toHaveBeenCalled();
  });

  it('shows no score for a game still to be played', async () => {
    getOverview.mockResolvedValue(overview({ is_finished: false, live_state: 'not_started', home_score: 0, away_score: 0 }, { boxScore: null }));
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.score).toBeNull();
    expect(result.current.boxScore).toBeNull();
  });

  it('reads score, period and box score off one live feed for full live updates', async () => {
    getOverview.mockResolvedValue(overview({ is_finished: false, live_state: 'in_progress' }, { liveSiteUpdate: 'full-live-update' }));
    getLive.mockResolvedValue(liveUpdate());
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.score).toEqual({ homeScore: 21, awayScore: 19 }));
    expect(result.current.isLive).toBe(true);
    expect(result.current.periodLabel).toBe('3º quarto · 04:10');
    expect(result.current.boxScore?.home.rows).toEqual([row('a1', { points: '15' }, 'photo-a1'), row('a3', { points: '6' })]);
    expect(result.current.boxScore?.home.totals).toEqual({ points: '21' });
    expect(getLive).toHaveBeenCalledTimes(1);
  });

  it('keeps the saved box score of a live game without full live updates', async () => {
    getOverview.mockResolvedValue(overview({ is_finished: false, live_state: 'in_progress' }, { sportSlug: 'volleyball' }));
    getLive.mockResolvedValue(liveUpdate());
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.score).toEqual({ homeScore: 21, awayScore: 19 }));
    expect(result.current.periodLabel).toBeNull();
    expect(result.current.boxScore?.home.totals).toEqual({ points: '11' });
  });

  it('drops the live badge once the scoreboard reports the game ended', async () => {
    getOverview.mockResolvedValue(overview({ is_finished: false, live_state: 'in_progress' }));
    getLive.mockResolvedValue(liveUpdate(true));
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.score).toEqual({ homeScore: 21, awayScore: 19 }));
    expect(result.current.isLive).toBe(false);
    expect(result.current.periodLabel).toBeNull();
  });

  it('surfaces errors', async () => {
    getOverview.mockRejectedValue(new AppError('falhou', 500));
    const { result } = renderHook(() => useGameDetailViewModel('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('falhou');
    expect(result.current.game).toBeNull();
    expect(result.current.boxScore).toBeNull();
    expect(result.current.score).toBeNull();
  });

  it('uses fallback message for unknown errors', async () => {
    getOverview.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useGameDetailViewModel('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Não foi possível carregar o detalhe do jogo.');
  });

  it('ignores a response that lands after unmount', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    getOverview
      .mockReturnValueOnce(new Promise((done) => { resolve = done; }))
      .mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const first = renderHook(() => useGameDetailViewModel('game-1'));
    first.unmount();
    await act(async () => { resolve(overview()); });
    expect(first.result.current.game).toBeNull();
    const second = renderHook(() => useGameDetailViewModel('game-1'));
    second.unmount();
    await act(async () => { reject(new Error('late')); });
    expect(second.result.current.error).toBeNull();
  });

  it('loads again on retry', async () => {
    getOverview.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(overview());
    const { result } = renderHook(() => useGameDetailViewModel('game-1', 'https://api.example/v1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.game).not.toBeNull());
    expect(getOverview).toHaveBeenCalledTimes(2);
    expect(getOverview).toHaveBeenCalledWith('game-1', 'https://api.example/v1');
  });

  it('refreshes behind the game on screen', async () => {
    getOverview.mockResolvedValue(overview());
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.game).not.toBeNull());
    getOverview.mockResolvedValueOnce(overview({ home_score: 30 }));

    act(() => result.current.refresh());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.game?.home_score).toBe(10);
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.game?.home_score).toBe(30);
    expect(result.current.refreshError).toBeNull();
  });

  it('keeps the game when a refresh fails', async () => {
    getOverview.mockResolvedValue(overview());
    const { result } = renderHook(() => useGameDetailViewModel('game-1'));
    await waitFor(() => expect(result.current.game).not.toBeNull());
    getOverview.mockRejectedValueOnce(new Error('offline'));

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.game?.home_score).toBe(10);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshError).toBe('Não foi possível atualizar. Puxe a tela para tentar novamente.');
  });
});
