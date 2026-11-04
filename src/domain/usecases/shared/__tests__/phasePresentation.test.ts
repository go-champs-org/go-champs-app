import { gamesFixture, tournamentDetailsFixture } from '../../../../test/fixtures/tournamentFixtures';
import { Game } from '../../../../models/GameModel';
import { buildDateKeys, buildTeamMap, closestDateKey, phaseKind, sortGamesByDate, teamShortName } from '../phasePresentation';

describe('phasePresentation', () => {
  it('sorts games and builds unique date keys', () => {
    expect(sortGamesByDate(gamesFixture).map((game) => game.id)).toEqual(['game-1', 'game-2']);
    expect(buildDateKeys(gamesFixture)).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('builds team maps from the roster and the games', () => {
    const map = buildTeamMap(gamesFixture, tournamentDetailsFixture.teams);
    expect(map['team-a']).toEqual({ name: 'Alpha', logo_url: 'https://example.com/alpha.png', tri_code: 'ALP' });
    expect(map['team-b']).toEqual({ name: 'Beta', logo_url: null, tri_code: 'BET' });
    expect(buildTeamMap(gamesFixture)['team-a'].logo_url).toBe('https://example.com/alpha.png');
  });

  it('keeps the roster logo when a game omits it and skips undecided teams', () => {
    const game = { ...gamesFixture[0], home_team: { ...gamesFixture[0].home_team, id: 'team-a', logo_url: null }, away_team: null } as unknown as Game;
    expect(buildTeamMap([game], tournamentDetailsFixture.teams)['team-a'].logo_url).toBe('https://example.com/alpha.png');
    expect(buildTeamMap([{ ...game, home_team: null } as unknown as Game])).toEqual({});
  });

  it.each([
    [{ name: 'Alpha', logo_url: null, tri_code: 'ALP' }, null, 'ALP'],
    [{ name: 'Alpha', logo_url: null, tri_code: null }, null, 'Alpha'],
    [undefined, 'Vencedor A', 'Vencedor A'],
    [undefined, null, 'A definir'],
  ])('names %o (placeholder %s) as %s', (team, placeholder, expected) => {
    expect(teamShortName(team, placeholder, 'A definir')).toBe(expected);
  });

  it.each([
    ['draw', 'bracket'],
    ['Elimination', 'standings'],
    ['registration', null],
    [null, null],
  ])('reads a %s phase as %s', (type, expected) => {
    expect(phaseKind({ type })).toBe(expected);
  });

  it('picks the match day closest to today, preferring the upcoming one on a tie', () => {
    const keys = ['2026-01-01', '2026-01-05', '2026-01-09'];
    expect(closestDateKey([], new Date('2026-01-04T12:00:00Z'))).toBeNull();
    expect(closestDateKey(keys, new Date('2025-12-01T12:00:00Z'))).toBe('2026-01-01');
    expect(closestDateKey(keys, new Date('2026-01-06T12:00:00Z'))).toBe('2026-01-05');
    expect(closestDateKey(keys, new Date('2026-01-07T12:00:00Z'))).toBe('2026-01-09');
    expect(closestDateKey(keys, new Date('2026-03-01T12:00:00Z'))).toBe('2026-01-09');
  });
});
