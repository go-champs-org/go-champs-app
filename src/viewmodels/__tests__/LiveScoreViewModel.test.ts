import { act, renderHook } from '@testing-library/react-native';
import { container } from '../../di/container';
import { useLiveGame, useLiveScore } from '../LiveScoreViewModel';

jest.mock('../../di/container', () => ({ container: { getLiveScore: { execute: jest.fn() } } }));

const execute = container.getLiveScore.execute as jest.Mock;
const initial = { homeScore: 0, awayScore: 0 };
const update = (homeScore: number, awayScore: number, ended = false) => ({ score: { homeScore, awayScore }, ended });

// Let the pending scoreboard promise settle inside act.
const flush = () => act(async () => { await Promise.resolve(); });
const tick = () => act(async () => { jest.advanceTimersByTime(10000); await Promise.resolve(); });

describe('useLiveScore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    execute.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it('polls a live game every ten seconds until the scoreboard reports it ended', async () => {
    execute.mockResolvedValueOnce(update(5, 11)).mockResolvedValueOnce(update(7, 11)).mockResolvedValueOnce(update(80, 70, true));
    const { result } = renderHook(() => useLiveScore('game-1', true, initial));
    await flush();
    expect(result.current).toEqual({ homeScore: 5, awayScore: 11 });
    await tick();
    expect(result.current).toEqual({ homeScore: 7, awayScore: 11 });
    await tick();
    expect(result.current).toEqual({ homeScore: 80, awayScore: 70 });
    await tick();
    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute).toHaveBeenCalledWith('game-1');
  });

  it('keeps the last score when a request fails and tries again', async () => {
    execute.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(update(2, 0));
    const { result } = renderHook(() => useLiveScore('game-1', true, { homeScore: 1, awayScore: 0 }));
    await flush();
    expect(result.current).toEqual({ homeScore: 1, awayScore: 0 });
    await tick();
    expect(result.current).toEqual({ homeScore: 2, awayScore: 0 });
  });

  it.each([
    [false, undefined],
    [true, 'https://go-champs-api-staging.herokuapp.com'],
  ])('never polls when live is %s on %s', async (live, apiBaseUrl) => {
    const { result } = renderHook(() => useLiveScore('game-1', live, initial, apiBaseUrl));
    await tick();
    expect(execute).not.toHaveBeenCalled();
    expect(result.current).toBe(initial);
  });

  it('stops polling once unmounted', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    execute.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const { result, unmount } = renderHook(() => useLiveScore('game-1', true, initial));
    unmount();
    await act(async () => { resolve(update(9, 9)); await Promise.resolve(); });
    await tick();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(initial);
  });

  it('ignores a failure that lands after unmount', async () => {
    let reject: (reason: unknown) => void = () => undefined;
    execute.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const { unmount } = renderHook(() => useLiveScore('game-1', true, initial));
    await flush();
    unmount();
    await act(async () => { reject(new Error('late')); await Promise.resolve(); });
    await tick();
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('hands back the whole feed and forgets it when the game changes', async () => {
    const full = { ...update(3, 1), period: { type: 'quarter', number: 2 }, timeLeft: '07:32', boxScore: { home: { rows: [], totals: {} }, away: { rows: [], totals: {} } } };
    execute.mockResolvedValueOnce(full).mockReturnValueOnce(new Promise(() => undefined));
    const { result, rerender } = renderHook(({ gameId }: { gameId: string }) => useLiveGame(gameId, true), { initialProps: { gameId: 'game-1' } });
    expect(result.current).toBeNull();
    await flush();
    expect(result.current).toBe(full);
    rerender({ gameId: 'game-2' });
    expect(result.current).toBeNull();
    expect(execute).toHaveBeenLastCalledWith('game-2');
  });
});
