import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { athleteProfile, liga, membership, recentGame } from '../../test/fixtures/athleteGamesFixtures';
import { NOTICE_DURATION_MS } from '../useFlashNotice';
import { REFRESH_ERROR } from '../useLoadRequest';
import { ATHLETE_HOME_ERROR, useAthleteHomeViewModel } from '../AthleteHomeViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAthleteHome: { execute: jest.fn() },
  },
}));

const execute = () => jest.mocked(container.getAthleteHome.execute);

const career = {
  sport_slug: 'basketball_5x5',
  sport_name: 'Basketball 5x5',
  tournaments_count: 2,
  stats: { game_played: 12, points: 257, points_per_game: 21.4 },
};

const memberships = ['a', 'b', 'c', 'd'].map((id) =>
  membership({ tournament: { ...membership().tournament, ...liga, id, name: `Liga ${id}` } })
);

const home = {
  profile: athleteProfile({ career_stats: [career], memberships, instagram: '@ana', facebook: 'ana.fb' }),
  recentGames: [recentGame()],
};

const loaded = async () => {
  execute().mockResolvedValue(home);
  const hook = renderHook(() => useAthleteHomeViewModel('ana'));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe('useAthleteHomeViewModel', () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.useRealTimers());

  it('loads nothing without a username', async () => {
    const { result } = renderHook(() => useAthleteHomeViewModel(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(result.current.summaries).toEqual([]);
    expect(result.current.socialLinks).toEqual([]);
    expect(execute()).not.toHaveBeenCalled();
  });

  it('loads the profile, its career, scoring form and tournaments', async () => {
    const { result } = await loaded();
    expect(execute()).toHaveBeenCalledWith('ana');
    expect(result.current.profile?.name).toBe('Ana Silva');
    expect(result.current.socialLinks.map((link) => link.network)).toEqual(['instagram', 'facebook']);
    expect(result.current.summaries.map((summary) => summary.title)).toEqual(['Basquete 5x5']);
    expect(result.current.forms.basketball_5x5.map((bar) => bar.label)).toEqual(['28']);
    expect(result.current.tournaments.map((card) => card.name)).toEqual(['Liga a', 'Liga b', 'Liga c']);
    expect(result.current.hasMoreTournaments).toBe(true);
  });

  it('shows every tournament on demand', async () => {
    const { result } = await loaded();
    act(() => result.current.toggleTournaments());
    expect(result.current.showAllTournaments).toBe(true);
    expect(result.current.tournaments).toHaveLength(4);
    act(() => result.current.toggleTournaments());
    expect(result.current.tournaments).toHaveLength(3);
  });

  it('shows an error when the first load fails, and retries', async () => {
    execute().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(home);
    const { result } = renderHook(() => useAthleteHomeViewModel('ana'));
    await waitFor(() => expect(result.current.error).toBe(ATHLETE_HOME_ERROR));
    expect(result.current.profile).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.profile?.name).toBe('Ana Silva'));
    expect(result.current.error).toBeNull();
  });

  it('keeps the profile when a refresh fails', async () => {
    const { result } = await loaded();
    execute().mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.refreshError).toBe(REFRESH_ERROR);
    expect(result.current.profile?.name).toBe('Ana Silva');
  });

  it('shows the saved notice and reloads after an edit', async () => {
    const { result } = await loaded();
    const updated = { ...home, profile: { ...home.profile, name: 'Ana Atualizada' } };
    execute().mockResolvedValueOnce(updated);
    jest.useFakeTimers();
    act(() => result.current.acknowledgeSave('Perfil de atleta atualizado.'));
    expect(result.current.notice).toBe('Perfil de atleta atualizado.');
    await waitFor(() => expect(result.current.profile?.name).toBe('Ana Atualizada'));
    expect(result.current.loading).toBe(false);
    act(() => jest.advanceTimersByTime(NOTICE_DURATION_MS));
    expect(result.current.notice).toBeNull();
  });

  it('clears the notice on demand', async () => {
    const { result } = await loaded();
    execute().mockResolvedValue(home);
    act(() => result.current.acknowledgeSave('Perfil de atleta criado.'));
    act(() => result.current.clearNotice());
    expect(result.current.notice).toBeNull();
  });
});
