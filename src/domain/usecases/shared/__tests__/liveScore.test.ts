import {
  hasLiveScoreboard,
  isLiveGame,
  livePeriodLabel,
  scoreboardBasketballPeriod,
  scoreboardPeriodTimeLeft,
  showsScore,
  toLiveScoreUpdate,
} from '../liveScore';

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
    expect(toLiveScoreUpdate(response(17, 12, 'in_progress'))).toMatchObject({ score: { homeScore: 17, awayScore: 12 }, ended: false });
    expect(toLiveScoreUpdate(response(80, 75, 'ended')).ended).toBe(true);
    expect(toLiveScoreUpdate(response(undefined, undefined))).toEqual({
      score: { homeScore: 0, awayScore: 0 },
      ended: false,
      period: null,
      timeLeft: null,
      boxScore: { home: { rows: [], totals: {} }, away: { rows: [], totals: {} } },
    });
  });

  const clock = (period?: number | null, time?: number | null) => ({
    data: { home_team: {}, away_team: {}, clock_state: { period, time } },
  });

  it.each([
    [1, { type: 'quarter', number: 1 }],
    [4, { type: 'quarter', number: 4 }],
    [5, { type: 'overtime', number: 1 }],
    [6, { type: 'overtime', number: 2 }],
    [0, null],
    [null, null],
  ])('reads basketball period %s as %o', (period, expected) => {
    expect(scoreboardBasketballPeriod(clock(period))).toEqual(expected);
  });

  it('reads no period without a clock', () => {
    expect(scoreboardBasketballPeriod({ data: { home_team: {}, away_team: {} } })).toBeNull();
  });

  it.each([
    [452, '07:32'],
    [59.9, '00:59'],
    [0, '00:00'],
    [-1, null],
    [null, null],
  ])('reads %s seconds left as %s', (time, expected) => {
    expect(scoreboardPeriodTimeLeft(clock(1, time))).toBe(expected);
  });

  it('names the period and the time left', () => {
    expect(livePeriodLabel({ type: 'quarter', number: 2 }, '07:32')).toBe('2º quarto · 07:32');
    expect(livePeriodLabel({ type: 'overtime', number: 1 }, null)).toBe('1ª prorrogação');
    expect(livePeriodLabel(null, '07:32')).toBeNull();
  });

  it('maps both sides of the live box score as strings', () => {
    const update = toLiveScoreUpdate({
      data: {
        home_team: {
          total_player_stats: { points: 12, rebounds: 4 },
          players: [
            { id: 'p1', name: 'Ana', number: '7', stats_values: { points: 12, minutes_played: 300 } },
            { id: 'p2', name: 'Bia', number: null, stats_values: null },
          ],
        },
        away_team: { total_player_stats: null, players: null },
        live_state: { state: 'in_progress' },
        clock_state: { period: 2, time: 452 },
      },
    });
    expect(update.period).toEqual({ type: 'quarter', number: 2 });
    expect(update.timeLeft).toBe('07:32');
    expect(update.boxScore.home).toEqual({
      rows: [
        { playerId: 'p1', name: 'Ana', number: '7', stats: { points: '12', minutes_played: '300' } },
        { playerId: 'p2', name: 'Bia', number: undefined, stats: {} },
      ],
      totals: { points: '12', rebounds: '4' },
    });
    expect(update.boxScore.away).toEqual({ rows: [], totals: {} });
  });
});
