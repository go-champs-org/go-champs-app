import { buildBoxScore, formatMinutesPlayed } from '../BoxScoreMapper';
import { GameDetail, PlayerStatsLog } from '../../../models/GameDetail';

const game: GameDetail = {
  id: 'game-1',
  phase_id: 'phase-1',
  datetime: '2026-09-23T20:00:00Z',
  location: 'Ginásio',
  city: 'Rio',
  court: null,
  number: '1',
  result_type: 'automatic',
  home_score: 77,
  away_score: 97,
  home_placeholder: null,
  away_placeholder: null,
  is_finished: true,
  live_state: 'ended',
  live_started_at: null,
  live_ended_at: null,
  youtube_code: null,
  info: null,
  assets: [],
  officials: [],
  web_url: null,
  home_team: {
    id: 'team-a',
    name: 'Alpha',
    logo_url: null,
    tri_code: 'ALP',
    players: [{ id: 'p1', name: 'Ana', shirt_number: '5' }],
  },
  away_team: {
    id: 'team-b',
    name: 'Beta',
    logo_url: null,
    tri_code: 'BET',
    players: [{ id: 'p2', name: 'Bia', shirt_number: '10' }],
  },
};

const logs: PlayerStatsLog[] = [
  {
    id: 'log-1',
    game_id: 'game-1',
    phase_id: 'phase-1',
    player_id: 'p1',
    team_id: 'team-a',
    tournament_id: 't1',
    stats: {
      minutes_played: '2070',
      points: '20',
      rebounds: '3',
      assists: '2',
      blocks: '1',
      steals: '0',
      turnovers: '1',
      efficiency: '22',
      plus_minus: '-5',
      free_throws_made: '2',
      free_throws_attempted: '2',
      free_throw_percentage: '100',
      field_goals_made: '4',
      field_goals_attempted: '8',
      field_goal_percentage: '50',
      three_point_field_goals_made: '2',
      three_point_field_goals_attempted: '4',
      three_point_field_goal_percentage: '50',
      game_played: '1',
    },
  },
];

describe('BoxScoreMapper', () => {
  it('formats minutes from seconds', () => {
    expect(formatMinutesPlayed(2070)).toBe('34:30');
    expect(formatMinutesPlayed(0)).toBe('0:00');
    expect(formatMinutesPlayed('90')).toBe('1:30');
    expect(formatMinutesPlayed(null)).toBe('0:00');
  });

  it('builds team sections with mapped columns', () => {
    const sections = buildBoxScore(game, logs);
    expect(sections).toHaveLength(2);
    expect(sections[0].teamName).toBe('Alpha');
    expect(sections[0].rows[0].values.min).toBe('34:30');
    expect(sections[0].rows[0].values.pts).toBe('20');
    expect(sections[0].rows[0].values.ll).toBe('2/2');
    expect(sections[0].rows[0].values.threePt).toBe('2/4');
    expect(sections[1].rows[0].values.pts).toBe('0');
  });

  it('sorts players by points descending', () => {
    const multiLogs: PlayerStatsLog[] = [
      {
        ...logs[0],
        id: 'log-low',
        player_id: 'p1',
        stats: { ...logs[0].stats, points: '5' },
      },
      {
        ...logs[0],
        id: 'log-high',
        player_id: 'p3',
        team_id: 'team-a',
        stats: { ...logs[0].stats, points: '30', game_played: '1' },
      },
    ];
    const withExtraPlayer: GameDetail = {
      ...game,
      home_team: {
        ...game.home_team!,
        players: [
          ...game.home_team!.players,
          { id: 'p3', name: 'Carla', shirt_number: '7' },
        ],
      },
    };
    const rows = buildBoxScore(withExtraPlayer, multiLogs)[0].rows;
    expect(rows[0].playerName).toBe('Carla');
    expect(rows[1].playerName).toBe('Ana');
  });

  it('handles missing teams', () => {
    expect(buildBoxScore({ ...game, home_team: null, away_team: null }, [])).toEqual([]);
  });

  it('covers empty and invalid stat values', () => {
    const oddLogs: PlayerStatsLog[] = [
      {
        id: 'log-odd',
        game_id: 'game-1',
        phase_id: 'phase-1',
        player_id: 'p1',
        team_id: 'team-a',
        tournament_id: 't1',
        stats: {
          minutes_played: '',
          points: 'not-a-number',
          free_throw_percentage: 'NaN',
          game_played: '1',
        },
      },
      {
        id: 'log-dnp',
        game_id: 'game-1',
        phase_id: 'phase-1',
        player_id: 'ghost',
        team_id: 'team-a',
        tournament_id: 't1',
        stats: { game_played: '0' },
      },
    ];
    const rows = buildBoxScore(game, oddLogs)[0].rows;
    expect(rows.some((row) => row.playerId === 'ghost')).toBe(false);
    expect(rows[0].values.min).toBe('0:00');
    expect(rows[0].values.pts).toBe('0');
    expect(rows[0].values.llPct).toBe('0%');
  });
});
