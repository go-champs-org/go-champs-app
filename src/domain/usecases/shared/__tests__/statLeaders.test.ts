import { formatLeaderValue, leaderCards, leaderStatKeys, leaderStatsFor, tournamentStatsUrl } from '../statLeaders';

const teams = [{ id: 'team-a', name: 'Alpha', logo_url: null, tri_code: 'ALP' }];

describe('statLeaders', () => {
  it('offers each scope of a recorded public stat of a known sport', () => {
    const playerStats = [
      { slug: 'points', title: 'PTS' },
      { slug: 'points_per_game', title: 'PTS/J' },
      { slug: 'rebounds_per_game', title: 'REB/J' },
      { slug: 'minutes_played', title: 'MIN' },
      { slug: 'field_goal_percentage', title: 'FG%' },
      { slug: null, title: 'Sem slug' },
    ];
    const stats = leaderStatsFor('basketball_5x5', playerStats);
    expect(stats).toEqual([
      { slug: 'points', title: 'Pontos', statKeys: { aggregate: 'points', per_game: 'points_per_game' } },
      { slug: 'rebounds', title: 'Rebotes', statKeys: { per_game: 'rebounds_per_game' } },
      { slug: 'field_goal_percentage', title: '% 2 Pontos', statKeys: { aggregate: 'field_goal_percentage' } },
    ]);
    expect(leaderStatKeys(stats)).toEqual(['points', 'points_per_game', 'rebounds_per_game', 'field_goal_percentage']);
    expect(leaderStatsFor('volleyball', playerStats)).toEqual([]);
  });

  it.each([
    ['points', 27.4, '27'],
    ['points_per_game', 27.46, '27.5'],
    ['field_goal_percentage', '48.6', '49%'],
    ['points', null, '-'],
    ['points', '', '-'],
    ['points', 'abc', '-'],
  ])('formats %s %s as %s', (statKey, value, expected) => {
    expect(formatLeaderValue(statKey, value)).toBe(expected);
  });

  it('builds a card per ranked stat with the first three leaders of each scope', () => {
    const leader = (id: string, team: string | null, photo?: string) => ({
      player_id: id, team_id: team, value: 10, player: { name: `Atleta ${id}`, photo_url: photo },
    });
    const cards = leaderCards(
      [
        { slug: 'points', title: 'Pontos', statKeys: { aggregate: 'points', per_game: 'points_per_game' } },
        { slug: 'rebounds', title: 'Rebotes', statKeys: { aggregate: 'rebounds' } },
      ],
      [
        { stat_key: 'points', leaders: [leader('1', 'team-a', 'https://example.com/1.png'), leader('2', null), leader('3', 'gone'), leader('4', 'team-a')] },
        { stat_key: 'points_per_game', leaders: [] },
      ],
      teams
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].scopes.map((scope) => scope.scope)).toEqual(['aggregate']);
    expect(cards[0].scopes[0].leaders.map((row) => [row.playerName, row.teamName, row.value, row.photoUrl])).toEqual([
      ['Atleta 1', 'Alpha', '10', 'https://example.com/1.png'],
      ['Atleta 2', '', '10', null],
      ['Atleta 3', '', '10', null],
    ]);
  });

  it('links to the public stats page of a stat', () => {
    expect(tournamentStatsUrl('org', 'copa', 'points_per_game')).toBe('https://go-champs.com/org/copa/stats?stat=points_per_game');
  });
});
