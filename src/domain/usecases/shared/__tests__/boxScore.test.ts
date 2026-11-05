import {
  BASKETBALL_5X5,
  boxScoreCellValue,
  boxScoreColumns,
  boxScoreRanking,
  didNotPlay,
  formatSecondsAsClock,
  formatStatValue,
  isStarter,
  nextBoxScoreSort,
  pollsLiveBoxScore,
  rankRows,
  shouldShowBoxScore,
  sortedBoxScoreTeam,
  withLiveStats,
} from '../boxScore';

const row = (playerId: string, stats: Record<string, string>, photoUrl?: string) => ({ playerId, name: playerId, stats, photoUrl });

describe('boxScore', () => {
  it('uses the fixed basketball 5x5 columns', () => {
    const columns = boxScoreColumns(BASKETBALL_5X5, [{ slug: 'points', title: 'Points' }]);
    expect(columns.map((column) => column.label).slice(0, 4)).toEqual(['MIN', 'PTS', 'REB', 'ASS']);
    expect(columns).toHaveLength(21);
    expect(columns.find((column) => column.slug === 'free_throws_made')?.attemptedSlug).toBe('free_throws_attempted');
  });

  it('lists another sport by its public, single-game statistics', () => {
    expect(
      boxScoreColumns('volleyball', [
        { slug: 'points', title: 'Points' },
        { slug: 'points_per_game', title: 'Points Per Game' },
        { slug: 'minutes_played', title: 'Minutes Played' },
        { slug: 'aces', title: 'Aces' },
        { slug: 'aces', title: 'Aces' },
        { id: 'legacy-id', slug: null, title: 'Antiga' },
        { slug: null, title: 'Sem identificador' },
      ])
    ).toEqual([
      { slug: 'points', label: 'PTS', description: 'Pontos' },
      { slug: 'aces', label: 'Aces', description: 'Aces' },
      { slug: 'legacy-id', label: 'Antiga', description: 'Antiga' },
    ]);
  });

  it('narrows basketball 3x3 to its game statistics, in its order', () => {
    const columns = boxScoreColumns('basketball_3x3', [
      { slug: 'disqualifying_fouls', title: 'Disqualifying Fouls (D)' },
      { slug: 'game_played', title: 'Game Played' },
      { slug: 'one_point_missed', title: 'One Point Missed' },
      { slug: 'plus_minus', title: 'Plus Minus' },
      { slug: 'points', title: 'Points' },
      { slug: 'one_point_made', title: 'One Point Made' },
      { slug: 'points_per_game', title: 'Points Per Game' },
      { slug: 'rebounds', title: 'Rebounds' },
    ]);
    expect(columns.map((column) => column.label)).toEqual(['PTS', '1PC', 'FD', '1PE', '+/-']);
    expect(columns[3].description).toBe('Arremessos de 1 ponto errados');
  });

  it.each([
    ['in_progress', 'full-live-update', 0, true],
    ['in_progress', 'score-only', 3, false],
    ['ended', null, 2, true],
    ['not_started', 'full-live-update', 0, false],
  ])('shows the box score of a %s game on %s with %s logs: %s', (state, update, logs, expected) => {
    expect(shouldShowBoxScore(state, update, logs)).toBe(expected);
  });

  it('polls the live box score only for a live game with full live updates', () => {
    expect(pollsLiveBoxScore('in_progress', 'full-live-update')).toBe(true);
    expect(pollsLiveBoxScore('in_progress', null)).toBe(false);
    expect(pollsLiveBoxScore('ended', 'full-live-update')).toBe(false);
  });

  it('formats cells like the public site', () => {
    const [minutes, points, , , , , , , , freeThrows, percentage] = boxScoreColumns(BASKETBALL_5X5, []);
    const stats = { minutes_played: '2070', points: '20', free_throws_made: '2', free_throws_attempted: '3', free_throw_percentage: '66.6' };
    expect(boxScoreCellValue(minutes, stats)).toBe('34:30');
    expect(boxScoreCellValue(minutes, {})).toBe('-');
    expect(boxScoreCellValue(points, stats)).toBe('20');
    expect(boxScoreCellValue(freeThrows, stats)).toBe('2 / 3');
    expect(boxScoreCellValue(freeThrows, {})).toBe('- / -');
    expect(boxScoreCellValue(percentage, stats)).toBe('67%');
    expect(formatStatValue('points', 'abc')).toBe('-');
    expect(formatSecondsAsClock(65)).toBe('01:05');
  });

  it('reads who did not play and who started', () => {
    expect(didNotPlay({ game_played: '0' })).toBe(true);
    expect(didNotPlay({ game_played: '1' })).toBe(false);
    expect(didNotPlay({})).toBe(false);
    expect(isStarter({ game_started: '1' })).toBe(true);
    expect(isStarter({})).toBe(false);
  });

  it('ranks starters, then minutes, then points', () => {
    const ranking = boxScoreRanking(BASKETBALL_5X5);
    const rows = [
      row('bench', { game_started: '0', minutes_played: '900', points: '30' }),
      row('starter-low', { game_started: '1', minutes_played: '600', points: '2' }),
      row('starter-high', { game_started: '1', minutes_played: '1200', points: '10' }),
      row('unknown', {}),
    ];
    expect(rankRows(rows, ranking).map((item) => item.playerId)).toEqual(['starter-high', 'starter-low', 'bench', 'unknown']);
    expect(boxScoreRanking('volleyball')).toEqual([]);
  });

  it('takes the saved photos into the live lines', () => {
    const team = { teamId: 't', teamName: 'Alpha', logoUrl: null, rows: [row('a', {}, 'photo-a')], totals: {} };
    const live = { rows: [row('a', { points: '3' }), row('b', { points: '5' }, 'photo-b'), row('c', {})], totals: { points: '8' } };
    const merged = withLiveStats(team, live, ['points']);
    expect(merged.teamName).toBe('Alpha');
    expect(merged.totals).toEqual({ points: '8' });
    expect(merged.rows.map((item) => [item.playerId, item.photoUrl])).toEqual([['b', 'photo-b'], ['a', 'photo-a'], ['c', '']]);
  });

  it('sorts by a tapped header, turning around on a second tap', () => {
    const first = nextBoxScoreSort(null, 'points');
    expect(first).toEqual({ slug: 'points', direction: 'desc' });
    expect(nextBoxScoreSort(first, 'points')).toEqual({ slug: 'points', direction: 'asc' });
    expect(nextBoxScoreSort({ slug: 'points', direction: 'asc' }, 'points')).toEqual({ slug: 'points', direction: 'desc' });
    expect(nextBoxScoreSort(first, 'rebounds')).toEqual({ slug: 'rebounds', direction: 'desc' });

    const team = { rows: [row('a', { points: '3' }), row('b', {}), row('c', { points: '9' })], totals: {} };
    expect(sortedBoxScoreTeam(team, null)).toBe(team);
    expect(sortedBoxScoreTeam(team, { slug: 'points', direction: 'asc' }).rows.map((item) => item.playerId)).toEqual(['a', 'c', 'b']);
    expect(sortedBoxScoreTeam(team, { slug: 'points', direction: 'desc' }).rows.map((item) => item.playerId)).toEqual(['c', 'a', 'b']);
    const missing = { rows: [row('x', {}), row('y', {})], totals: {} };
    expect(sortedBoxScoreTeam(missing, { slug: 'points', direction: 'desc' }).rows.map((item) => item.playerId)).toEqual(['x', 'y']);
  });
});
