import { gamesFixture, tournamentDetailsFixture } from '../../../../test/fixtures/tournamentFixtures';
import { buildDateKeys, buildTeamMap, sortGamesByDate, sortStatsByRanking } from '../phasePresentation';

describe('phasePresentation', () => {
  it('sorts games, stats, and unique date keys', () => {
    expect(sortGamesByDate(gamesFixture).map((game) => game.id)).toEqual(['game-1', 'game-2']);
    expect(sortStatsByRanking([{ id: 'b', title: 'B', ranking_order: 2, team_stat_source: 'manual' }, { id: 'a', title: 'A', ranking_order: 1, team_stat_source: 'manual' }]).map((stat) => stat.id)).toEqual(['a', 'b']);
    expect(buildDateKeys(gamesFixture)).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('builds team maps with or without logos', () => {
    expect(buildTeamMap(gamesFixture, tournamentDetailsFixture)['team-a'].logo_url).toBe(
      'https://example.com/alpha.png'
    );
    expect(buildTeamMap(gamesFixture, tournamentDetailsFixture, { includeLogos: false })['team-a'].logo_url).toBeNull();
  });
});
