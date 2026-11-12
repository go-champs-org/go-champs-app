import { ScreenTracker } from '../ScreenTracker';
import type { AnalyticsClient } from '../AnalyticsClient';

const make = () => {
  let now = 0;
  const analytics = { track: jest.fn(), flush: jest.fn() };
  const tracker = new ScreenTracker(analytics as unknown as AnalyticsClient, () => now);
  return { tracker, analytics, advance: (ms: number) => { now += ms; } };
};
const live = { game_id: 'g1', tournament_id: 't1', organization_id: 'o1' };

it('records three views and three foreground durations, including background exit', () => {
  const { tracker, analytics, advance } = make();
  for (const [key, name] of [['h', 'HomeTab'], ['t', 'TournamentScreen'], ['p', 'ProfileTab']]) {
    tracker.navigate({ key, name }); advance(1000);
  }
  tracker.setActive(false);
  expect(analytics.track.mock.calls.filter(([event]) => event === 'Screen Viewed')).toHaveLength(3);
  expect(analytics.track.mock.calls.filter(([event]) => event === 'Screen Exited')).toEqual([
    ['Screen Exited', { screen_name: 'HomeTab', duration_ms: 1000 }],
    ['Screen Exited', { screen_name: 'TournamentScreen', duration_ms: 1000 }],
    ['Screen Exited', { screen_name: 'ProfileTab', duration_ms: 1000 }],
  ]);
  expect(analytics.flush).toHaveBeenCalledTimes(1);
});

it('deduplicates onReady/state changes and excludes all background time', () => {
  const { tracker, analytics, advance } = make();
  tracker.navigate({ key: 'h', name: 'HomeTab' }); tracker.navigate({ key: 'h', name: 'HomeTab' });
  advance(1000); tracker.setActive(false); tracker.setActive(false); advance(100_000);
  tracker.setActive(true); tracker.setActive(true); advance(2000); tracker.dispose(); tracker.dispose();
  const exits = analytics.track.mock.calls.filter(([event]) => event === 'Screen Exited');
  expect(exits.map(([, p]) => p.duration_ms)).toEqual([1000, 2000]);
});

it('handles navigation while backgrounded, missing routes and unknown screens safely', () => {
  const { tracker, analytics } = make();
  tracker.setActive(false); tracker.navigate({ key: 'h', name: 'HomeTab' });
  tracker.navigate({ key: 'p', name: 'ProfileTab' });
  expect(analytics.track).not.toHaveBeenCalled();
  tracker.setActive(true); tracker.navigate({ key: 'x', name: 'Private Name' }); tracker.navigate();
  expect(analytics.track.mock.calls.map(([event]) => event)).toEqual(['Screen Viewed', 'Screen Exited']);
});

it('tracks live once per opening, with one minute of foreground viewing', () => {
  const { tracker, analytics, advance } = make();
  tracker.registerLive('g', live);
  tracker.navigate({ key: 'g', name: 'GameDetailScreen' });
  tracker.registerLive('g', live); tracker.registerLive('g', live);
  advance(60_000); tracker.navigate({ key: 'h', name: 'HomeTab' });
  expect(analytics.track.mock.calls.filter(([e]) => e === 'Live Game Viewed')).toEqual([['Live Game Viewed', live]]);
  expect(analytics.track).toHaveBeenCalledWith('Screen Exited', { screen_name: 'GameDetailScreen', duration_ms: 60_000, is_live: true });
  tracker.navigate({ key: 'g', name: 'GameDetailScreen' });
  expect(analytics.track.mock.calls.filter(([e]) => e === 'Live Game Viewed')).toHaveLength(2);
});

it('does not count polling, background arrival or ended-game cleanup as a new opening', () => {
  const { tracker, analytics, advance } = make();
  tracker.navigate({ key: 'g', name: 'GameDetailScreen' });
  tracker.setActive(false); tracker.registerLive('g', live);
  expect(analytics.track.mock.calls.filter(([e]) => e === 'Live Game Viewed')).toHaveLength(0);
  tracker.setActive(true); tracker.registerLive('g', live);
  tracker.forgetLive('g'); advance(500); tracker.dispose();
  expect(analytics.track.mock.calls.filter(([e]) => e === 'Live Game Viewed')).toHaveLength(1);
  expect(analytics.track).toHaveBeenCalledWith('Screen Exited', expect.objectContaining({ is_live: true, duration_ms: 500 }));
});

it('tracks separate route keys for the same screen and supports the monotonic default clock', () => {
  const { tracker, analytics } = make();
  tracker.navigate({ key: 'a', name: 'GameDetailScreen' }); tracker.navigate({ key: 'b', name: 'GameDetailScreen' });
  expect(analytics.track.mock.calls.filter(([e]) => e === 'Screen Viewed')).toHaveLength(2);
  const defaultClock = new ScreenTracker(analytics as unknown as AnalyticsClient);
  defaultClock.navigate({ key: 'h', name: 'HomeTab' }); defaultClock.dispose();
});
