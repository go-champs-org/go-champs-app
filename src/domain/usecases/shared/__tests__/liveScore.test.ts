import { hasLiveScoreboard, isLiveGame, showsScore, toLiveScoreUpdate } from '../liveScore';

const response = (home: number | undefined, away: number | undefined, state?: string) => ({
  data: {
    home_team: { total_player_stats: home === undefined ? null : { points: home } },
    away_team: { total_player_stats: away === undefined ? undefined : { points: away } },
    ...(state ? { live_state: { state } } : {}),
  },
});

describe('liveScore', () => {
  it('reads only an in-progress game as live', () => {
    expect(isLiveGame('in_progress')).toBe(true);
    expect(isLiveGame('ended')).toBe(false);
    expect(isLiveGame(null)).toBe(false);
  });

  it.each([
    [{ is_finished: true, live_state: 'ended' }, true],
    [{ is_finished: false, live_state: 'in_progress' }, true],
    [{ is_finished: false, live_state: 'not_started' }, false],
  ])('shows the score of %o: %s', (game, expected) => {
    expect(showsScore(game)).toBe(expected);
  });

  it('polls only production tournaments', () => {
    expect(hasLiveScoreboard()).toBe(true);
    expect(hasLiveScoreboard('https://api.go-champs.com/v1')).toBe(true);
    expect(hasLiveScoreboard('https://go-champs-api-staging.herokuapp.com')).toBe(false);
  });

  it('maps team points and ends only on a reported non-live state', () => {
    expect(toLiveScoreUpdate(response(17, 12, 'in_progress'))).toEqual({ score: { homeScore: 17, awayScore: 12 }, ended: false });
    expect(toLiveScoreUpdate(response(80, 75, 'ended')).ended).toBe(true);
    expect(toLiveScoreUpdate(response(undefined, undefined))).toEqual({ score: { homeScore: 0, awayScore: 0 }, ended: false });
  });
});
