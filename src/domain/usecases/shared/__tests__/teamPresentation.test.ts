import { BoxScoreRow } from '../../../../models/GameDetail';
import { Game } from '../../../../models/GameModel';
import { Player } from '../../../../models/TournamentHistory';
import { gamesFixture } from '../../../../test/fixtures/tournamentFixtures';
import {
  gameWinner,
  labelCoaches,
  rosterTotals,
  sideEmphasis,
  teamGameDays,
  teamRosterRows,
} from '../teamPresentation';

const player = (id: string, name: string, shirtNumber: string | null, teamId = 'team-a'): Player => ({
  id,
  name,
  shirt_number: shirtNumber,
  team_id: teamId,
  photo_url: id === 'p1' ? 'https://photo/p1.png' : null,
  facebook: null,
  instagram: null,
  registration_response: null,
  shirt_name: null,
  twitter: null,
  username: null,
});

const game = (id: string, datetime: string, overrides: Partial<Game> = {}): Game => ({
  ...gamesFixture[0],
  id,
  datetime,
  ...overrides,
});

describe('gameWinner', () => {
  it('reads the winner off a finished score', () => {
    expect(gameWinner({ home_score: 10, away_score: 8, is_finished: true })).toBe('home');
    expect(gameWinner({ home_score: 7, away_score: 8, is_finished: true })).toBe('away');
  });

  it('leaves a game undecided while it runs, before it starts, or when drawn', () => {
    expect(gameWinner({ home_score: 10, away_score: 8, is_finished: false })).toBeUndefined();
    expect(gameWinner({ home_score: 8, away_score: 8, is_finished: true })).toBeUndefined();
  });

  it('takes a walkover winner from the result type, whatever the score', () => {
    expect(gameWinner({ home_score: 0, away_score: 0, is_finished: false, result_type: 'away_team_walkover' })).toBe('away');
    expect(gameWinner({ home_score: 0, away_score: 20, is_finished: true, result_type: 'home_team_walkover' })).toBe('home');
  });
});

describe('sideEmphasis', () => {
  it('leads with the winner and steps the loser back', () => {
    expect(sideEmphasis('home', 'home')).toBe('winner');
    expect(sideEmphasis('home', 'away')).toBe('loser');
    expect(sideEmphasis(undefined, 'home')).toBe('neutral');
  });
});

describe('teamRosterRows', () => {
  const players = [
    player('p3', 'Carla', null),
    player('p2', 'Bia', '10'),
    player('p1', 'Ana', '4'),
    player('p4', 'Alice', ''),
    player('px', 'Outra', '1', 'team-b'),
  ];

  it('lists the team by shirt number, then the unnumbered by name, with their numbers as text', () => {
    const rows = teamRosterRows(players, 'team-a', [
      { id: 'l1', player_id: 'p1', stats: { points: 12, assists: null, rebounds: '' } },
      { id: 'l9', player_id: 'px', stats: { points: 40 } },
    ]);

    expect(rows.map((row) => row.name)).toEqual(['Ana', 'Bia', 'Alice', 'Carla']);
    expect(rows[0]).toEqual({ playerId: 'p1', name: 'Ana', number: '4', photoUrl: 'https://photo/p1.png', stats: { points: '12' } });
    expect(rows[2]).toEqual({ playerId: 'p4', name: 'Alice', number: undefined, photoUrl: undefined, stats: {} });
  });

  it('keeps an athlete with no stats log on the roster', () => {
    expect(teamRosterRows([player('p1', 'Ana', '4')], 'team-a', [{ id: 'l', player_id: 'p1', stats: undefined as never }])).toEqual([
      expect.objectContaining({ playerId: 'p1', stats: {} }),
    ]);
  });
});

describe('rosterTotals', () => {
  const rows: BoxScoreRow[] = [
    { playerId: 'a', name: 'A', stats: { points: '10', minutes_played: '90', game_played: '3', field_goal_percentage: '50' } },
    { playerId: 'b', name: 'B', stats: { points: '5', minutes_played: '45', game_played: '2' } },
  ];

  it('adds up only the counts the athletes have numbers for', () => {
    expect(
      rosterTotals(rows, ['points', 'minutes_played', 'game_played', 'field_goal_percentage', 'points_per_game', 'assists'])
    ).toEqual({ points: '15', minutes_played: '135' });
  });
});

describe('labelCoaches', () => {
  it('labels the known coach types and leaves the rest blank', () => {
    expect(
      labelCoaches([
        { id: 'c1', name: 'Rui', type: 'head_coach' },
        { id: 'c2', name: 'Lia', type: 'assistant_coach' },
        { id: 'c3', name: 'Zé', type: 'physio' },
        { id: 'c4', name: 'Bo', type: null },
      ])
    ).toEqual([
      { id: 'c1', name: 'Rui', label: 'Treinador principal' },
      { id: 'c2', name: 'Lia', label: 'Assistente' },
      { id: 'c3', name: 'Zé', label: '' },
      { id: 'c4', name: 'Bo', label: '' },
    ]);
    expect(labelCoaches(undefined)).toEqual([]);
  });
});

describe('teamGameDays', () => {
  it('groups by day, newest day first, each day in kickoff order, undated games last', () => {
    const days = teamGameDays([
      game('early', '2026-10-01T18:00:00Z'),
      game('late', '2026-10-31T20:00:00Z'),
      game('undated', '', { datetime: null as never }),
      game('first', '2026-10-31T13:30:00Z'),
    ]);

    expect(days.map((day) => [day.key, day.label, day.games.map((item) => item.id)])).toEqual([
      ['2026-10-31', '31 de outubro de 2026', ['first', 'late']],
      ['2026-10-01', '1 de outubro de 2026', ['early']],
      ['', '', ['undated']],
    ]);
  });

  it('has no days without games', () => {
    expect(teamGameDays([])).toEqual([]);
  });
});
