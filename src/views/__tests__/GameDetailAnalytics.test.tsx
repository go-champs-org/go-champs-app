import React from 'react';
import { render } from '@testing-library/react-native';
import GameDetailScreen from '../GameDetailScreen';
import { useGameDetailViewModel } from '../../viewmodels/GameDetailViewModel';
import { analyticsScreens } from '../../core/analytics/analytics';

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('../../core/analytics/analytics', () => ({ analyticsScreens: { registerLive: jest.fn(), forgetLive: jest.fn() } }));
jest.mock('../../viewmodels/GameDetailViewModel', () => ({ useGameDetailViewModel: jest.fn() }));
jest.mock('../../components/video/YouTubePlayer', () => ({ YouTubePlayer: () => null }));

const route = { key: 'route-g1', name: 'GameDetailScreen' as const, params: { gameId: 'g1' } };
const game = { id: 'g1', home_team: null, away_team: null, assets: [], officials: [], youtube_code: null,
  phase: { tournament: { id: 't1', name: 'Private Tournament', organization: { id: 'o1', name: 'Private Organization' } } } };
const model = (overrides: Record<string, unknown> = {}) => ({
  loading: false, error: null, game, isLive: true, boxScore: null, score: null,
  refreshing: false, refreshError: null, refresh: jest.fn(), retry: jest.fn(), ...overrides,
});
beforeEach(() => jest.clearAllMocks());

it('registers only opaque live-game ids, not every scoreboard update', () => {
  jest.mocked(useGameDetailViewModel).mockReturnValue(model() as never);
  const screen = render(<GameDetailScreen route={route} />);
  expect(analyticsScreens.registerLive).toHaveBeenCalledWith('route-g1', { game_id: 'g1', tournament_id: 't1', organization_id: 'o1' });
  jest.mocked(useGameDetailViewModel).mockReturnValue(model({ score: { homeScore: 4, awayScore: 2 } }) as never);
  screen.rerender(<GameDetailScreen route={route} />);
  expect(analyticsScreens.registerLive).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(jest.mocked(analyticsScreens.registerLive).mock.calls)).not.toContain('Private');
  screen.unmount();
  expect(analyticsScreens.forgetLive).toHaveBeenCalledWith('route-g1');
});

it.each([{ loading: true }, { error: 'failed', loading: false }, { isLive: false }, { game: { ...game, id: 'stale-game' } }])(
  'does not register loading, failed, finished or stale data: %p', (overrides) => {
    jest.mocked(useGameDetailViewModel).mockReturnValue(model(overrides) as never);
    render(<GameDetailScreen route={route} />);
    expect(analyticsScreens.registerLive).not.toHaveBeenCalled();
  }
);

it('can count a live game whose parent ids are not available', () => {
  jest.mocked(useGameDetailViewModel).mockReturnValue(model({ game: { ...game, phase: null } }) as never);
  render(<GameDetailScreen route={route} />);
  expect(analyticsScreens.registerLive).toHaveBeenCalledWith('route-g1', { game_id: 'g1', tournament_id: null, organization_id: null });
});
