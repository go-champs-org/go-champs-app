import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { athleteProfile, recentGame } from '../../test/fixtures/athleteGamesFixtures';
import { useHomeCampaigns } from '../useHomeCampaigns';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));
jest.mock('../../di/container', () => ({ container: { getAthleteHome: { execute: jest.fn() } } }));
const lookup = jest.mocked(container.getAthleteHome.execute);
beforeEach(() => lookup.mockReset());

test('guest campaigns wait for session restoration', () => {
  const hook = renderHook((busy: boolean) => useHomeCampaigns(undefined, busy), { initialProps: true });
  expect(hook.result.current.campaigns).toEqual([]);
  hook.rerender(false);
  expect(hook.result.current.campaigns).toEqual(['create']);
  expect(lookup).not.toHaveBeenCalled();
});

test('distinguishes a missing profile from one without career stats', async () => {
  lookup.mockResolvedValueOnce({ profile: null, recentGames: [] })
    .mockResolvedValueOnce({ profile: athleteProfile({ career_stats: [] }), recentGames: [recentGame({}, { stats: {} })] });
  const hook = renderHook((name: string) => useHomeCampaigns(name, false), { initialProps: 'ana' });
  await waitFor(() => expect(hook.result.current.campaigns).toEqual(['create']));
  hook.rerender('bia');
  await waitFor(() => expect(hook.result.current.campaigns).toEqual(['progress']));
});

test('failed lookup does not offer creation or sharing', async () => {
  lookup.mockRejectedValueOnce(new Error('offline'));
  const hook = renderHook(() => useHomeCampaigns('ana', false));
  await act(async () => {});
  expect(lookup).toHaveBeenCalledWith('ana');
  expect(hook.result.current.campaigns).toEqual([]);
});

test('uses the latest game with statistics for the actual share sheet', async () => {
  lookup.mockResolvedValueOnce({ profile: athleteProfile(), recentGames: [recentGame({}, { stats: {} }), recentGame({}, { stats: { points: 19 } })] });
  const hook = renderHook(() => useHomeCampaigns('ana', false));
  await waitFor(() => expect(hook.result.current.campaigns).toEqual(['share', 'progress']));
  expect(hook.result.current.card?.stats).toContainEqual({ key: 'points', label: 'PTS', value: '19' });
});
