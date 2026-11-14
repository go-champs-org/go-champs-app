import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { athleteProfile, liga, recentGame, teamGame } from '../../test/fixtures/athleteGamesFixtures';
import { deferred } from '../../test/deferred';
import { REFRESH_ERROR } from '../useLoadRequest';
import { MY_GAMES_ERROR, useMyGamesViewModel } from '../MyGamesViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAthleteGames: { execute: jest.fn() },
  },
}));

const execute = () => jest.mocked(container.getAthleteGames.execute);

// Far ahead, so they stay upcoming whatever day the test runs.
const copaGame = teamGame({ id: 'copa-game', datetime: '2099-03-10T19:00:00Z' });
const ligaGame = teamGame({ id: 'liga-game', datetime: '2099-03-12T19:00:00Z', tournament: liga });
const copaResult = recentGame({ id: 'copa-result' });
const ligaResult = recentGame({ id: 'liga-result', tournament: { ...liga, sport_slug: 'basketball_5x5' } });

const games = {
  profile: athleteProfile(),
  teamGames: [ligaGame, copaGame],
  recentGames: [copaResult, ligaResult],
};

const loaded = async () => {
  execute().mockResolvedValue(games);
  const hook = renderHook(() => useMyGamesViewModel('ana'));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe('useMyGamesViewModel', () => {
  beforeEach(() => jest.resetAllMocks());

  it('asks to sign in without a username and loads nothing', async () => {
    const { result } = renderHook(() => useMyGamesViewModel(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.needsAuth).toBe(true);
    expect(result.current.next).toBeNull();
    expect(execute()).not.toHaveBeenCalled();
  });

  it("loads the athlete's games into sections", async () => {
    const { result } = await loaded();
    expect(execute()).toHaveBeenCalledWith('ana');
    expect(result.current.needsAuth).toBe(false);
    expect(result.current.needsAthleteProfile).toBe(false);
    expect(result.current.next?.id).toBe('copa-game');
    expect(result.current.upcoming.map((game) => game.id)).toEqual(['liga-game']);
    expect(result.current.previous.map((recent) => recent.game.id)).toEqual(['copa-result', 'liga-result']);
    expect(result.current.hasGames).toBe(true);
    expect(result.current.tournaments).toEqual([
      { id: 'copa', name: 'Copa Central' },
      { id: 'liga', name: 'Liga Norte' },
    ]);
  });

  it('filters the loaded games locally, without asking the API again', async () => {
    const { result } = await loaded();

    act(() => result.current.selectTournament('liga'));
    expect(result.current.tournamentId).toBe('liga');
    expect(result.current.next?.id).toBe('liga-game');
    expect(result.current.upcoming).toEqual([]);
    expect(result.current.previous.map((recent) => recent.game.id)).toEqual(['liga-result']);

    act(() => result.current.selectTournament(null));
    expect(result.current.previous).toHaveLength(2);
    expect(execute()).toHaveBeenCalledTimes(1);
  });

  it('asks for an athlete profile when the username has none', async () => {
    execute().mockResolvedValue({ profile: null, teamGames: [], recentGames: [] });
    const { result } = renderHook(() => useMyGamesViewModel('ana'));
    await waitFor(() => expect(result.current.needsAthleteProfile).toBe(true));
    expect(result.current.hasGames).toBe(false);
  });

  it('loads again on a recheck once the athlete profile was missing', async () => {
    execute().mockResolvedValueOnce({ profile: null, teamGames: [], recentGames: [] });
    const { result } = renderHook(() => useMyGamesViewModel('ana'));
    await waitFor(() => expect(result.current.needsAthleteProfile).toBe(true));

    const pending = deferred<typeof games>();
    execute().mockReturnValueOnce(pending.promise);
    act(() => result.current.recheckAthleteProfile());
    // The loader replaces the "create your profile" prompt while it loads.
    expect(result.current.loading).toBe(true);
    expect(result.current.needsAthleteProfile).toBe(false);

    await act(async () => pending.resolve(games));
    expect(result.current.needsAthleteProfile).toBe(false);
    expect(result.current.next?.id).toBe('copa-game');
    expect(execute()).toHaveBeenCalledTimes(2);
  });

  it('skips the recheck when the athlete profile was already there', async () => {
    const { result } = await loaded();
    act(() => result.current.recheckAthleteProfile());
    expect(result.current.loading).toBe(false);
    expect(execute()).toHaveBeenCalledTimes(1);
  });

  it('shows an error when the first load fails, and retries', async () => {
    execute().mockRejectedValueOnce(new AppError('offline', 500)).mockResolvedValue(games);
    const { result } = renderHook(() => useMyGamesViewModel('ana'));
    await waitFor(() => expect(result.current.error).toBe(MY_GAMES_ERROR));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.next?.id).toBe('copa-game'));
    expect(result.current.error).toBeNull();
  });

  it('refreshes in the background and keeps the filters', async () => {
    const { result } = await loaded();
    act(() => result.current.selectTournament('liga'));
    const pending = deferred<typeof games>();
    execute().mockReturnValueOnce(pending.promise);
    act(() => result.current.refresh());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    await act(async () => pending.resolve({ ...games, teamGames: [ligaGame] }));
    expect(result.current.refreshing).toBe(false);
    expect(result.current.tournamentId).toBe('liga');
    expect(result.current.next?.id).toBe('liga-game');
  });

  it('keeps the games when a refresh fails', async () => {
    const { result } = await loaded();
    execute().mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.refreshError).toBe(REFRESH_ERROR);
    expect(result.current.error).toBeNull();
    expect(result.current.next?.id).toBe('copa-game');
  });

  it('falls back to every tournament when the selected one leaves after a refresh', async () => {
    const { result } = await loaded();
    act(() => result.current.selectTournament('liga'));
    execute().mockResolvedValueOnce({ ...games, teamGames: [copaGame], recentGames: [copaResult] });
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.tournamentId).toBeNull();
    expect(result.current.next?.id).toBe('copa-game');
  });

  it('builds the share sticker of a result with the athlete from the profile', async () => {
    const { result } = await loaded();
    expect(result.current.shareCard(copaResult)).toMatchObject({
      gameId: 'copa-result',
      athleteName: 'Ana Silva',
      shirtNumber: '#7',
      tournament: { name: 'Copa Central' },
    });
  });
});
