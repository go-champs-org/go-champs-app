import { formatLeaderValue, leaderCards, leaderStatsFor } from '../statLeaders';

const teams = [{ id: 'team-a', name: 'Alpha', logo_url: null }];

describe('statLeaders', () => {
  it('highlights only the recorded public stats of a known sport', () => {
    const playerStats = [
      { slug: 'points', title: 'PTS' },
      { slug: 'minutes_played', title: 'MIN' },
      { slug: 'field_goal_percentage', title: 'FG%' },
      { slug: null, title: 'Sem slug' },
    ];
    expect(leaderStatsFor('basketball_5x5', playerStats)).toEqual([
      { slug: 'points', title: 'Pontos' },
      { slug: 'field_goal_percentage', title: '% 2 Pontos' },
    ]);
    expect(leaderStatsFor('volleyball', playerStats)).toEqual([]);
  });

  it.each([
    ['points', 27.4, '27'],
    ['field_goal_percentage', '48.6', '49%'],
    ['points', null, '-'],
    ['points', '', '-'],
    ['points', 'abc', '-'],
  ])('formats %s %s as %s', (slug, value, expected) => {
    expect(formatLeaderValue(slug, value)).toBe(expected);
  });

  it('builds a card per ranked stat with the first three leaders', () => {
    const leader = (id: string, team: string | null) => ({ player_id: id, team_id: team, value: 10, player: { name: `Atleta ${id}` } });
    const cards = leaderCards(
      [{ slug: 'points', title: 'Pontos' }, { slug: 'rebounds', title: 'Rebotes' }],
      [{ stat_key: 'points', leaders: [leader('1', 'team-a'), leader('2', null), leader('3', 'gone'), leader('4', 'team-a')] }],
      teams
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].leaders.map((row) => [row.playerName, row.teamName, row.value, row.photoUrl])).toEqual([
      ['Atleta 1', 'Alpha', '10', null],
      ['Atleta 2', '', '10', null],
      ['Atleta 3', '', '10', null],
    ]);
  });
});
