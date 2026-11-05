import { PlayerStatsLog } from '../../../../models/GameDetail';
import {
  athletePhaseTable,
  athleteProfileColumns,
  athleteSocialLinks,
  gamesPlayedText,
  phaseCellValue,
  PhaseStatRow,
} from '../athleteProfile';

const stat = (slug: string, title = slug) => ({ id: slug, slug, title });

const log = (phaseId: string | null, stats: PlayerStatsLog['stats']): PlayerStatsLog => ({
  id: `${phaseId}-${Math.random()}`,
  game_id: 'g',
  phase_id: phaseId,
  player_id: 'p1',
  team_id: 'team-a',
  tournament_id: 't1',
  stats,
});

const row = (overrides: Partial<PhaseStatRow> = {}): PhaseStatRow => ({
  phaseId: 'ph',
  label: 'Fase',
  games: 2,
  sums: {},
  counts: {},
  ...overrides,
});

describe('athleteProfileColumns', () => {
  it('keeps the curated 5x5 set the tournament records, in sport order, private stats included', () => {
    const columns = athleteProfileColumns('basketball_5x5', [
      stat('points', 'Points'),
      stat('game_played'),
      stat('minutes_played'),
      stat('points_per_game'),
      stat('fouls_personal'),
      stat('custom_stat'),
      { id: 'x', slug: null, title: 'Nothing' },
    ]);
    expect(columns).toEqual([
      { key: 'minutes_played', label: 'MIN', description: 'Minutos jogados' },
      { key: 'points', label: 'PTS', description: 'Pontos' },
      { key: 'fouls_personal', label: 'FLP', description: 'Faltas pessoais' },
    ]);
  });

  it('uses the 3x3 profile set', () => {
    expect(athleteProfileColumns('basketball_3x3', [stat('one_point_attempted'), stat('points')]).map((c) => c.key)).toEqual([
      'points',
    ]);
  });

  it('falls back to the box score columns for a sport with no curated set', () => {
    expect(
      athleteProfileColumns('volleyball', [stat('aces', 'Aces'), stat('aces_per_game'), stat('game_played')])
    ).toEqual([{ key: 'aces', label: 'Aces', description: 'Aces' }]);
  });
});

describe('athletePhaseTable', () => {
  const phases = [
    { id: 'ph2', title: 'Playoffs', order: 2 },
    { id: 'ph1', title: 'Grupos', order: 1 },
    { id: 'ph3', title: 'Final', order: 3 },
  ];

  it('adds the games up per phase in phase order, skipping unplayed phases and empty values', () => {
    const table = athletePhaseTable(
      [
        log('ph2', { points: '10' }),
        log('ph1', { points: '4', rebounds: '' }),
        log('ph1', { points: 6, rebounds: null, assists: 'abc' }),
        log(null, { points: '1' }),
      ],
      phases
    );
    expect(table.rows.map((r) => [r.label, r.games, r.sums])).toEqual([
      ['Grupos', 2, { points: 10 }],
      ['Playoffs', 1, { points: 10 }],
    ]);
    expect(table.total).toMatchObject({ label: 'Total', games: 4, sums: { points: 21 }, counts: { points: 4 } });
  });

  it('reads a log without stats as a game with nothing recorded', () => {
    const table = athletePhaseTable([{ ...log('ph1', {}), stats: undefined as never }], phases);
    expect(table.rows[0]).toMatchObject({ games: 1, sums: {} });
  });
});

describe('phaseCellValue', () => {
  it('works shooting percentages out from makes and attempts', () => {
    const shots = row({ sums: { field_goals_made: 3, field_goals_attempted: 4, free_throws_attempted: 0 } });
    expect(phaseCellValue('field_goal_percentage', shots, 'aggregate')).toBe('75%');
    expect(phaseCellValue('field_goal_percentage', shots, 'per_game')).toBe('75%');
    expect(phaseCellValue('free_throw_percentage', shots, 'aggregate')).toBe('-');
    expect(phaseCellValue('field_goal_percentage', row({ sums: { field_goals_attempted: 2 } }), 'aggregate')).toBe('0%');
  });

  it('averages a percentage recorded without attempts', () => {
    expect(phaseCellValue('one_point_percentage', row({ sums: { one_point_percentage: 90 }, counts: { one_point_percentage: 2 } }), 'aggregate')).toBe('45%');
    expect(phaseCellValue('one_point_percentage', row(), 'aggregate')).toBe('-');
  });

  it('reads counts whole or per game, keeping starts a count', () => {
    const counts = row({ games: 4, sums: { points: 30, game_started: 3, minutes_played: 4800 } });
    expect(phaseCellValue('points', counts, 'aggregate')).toBe('30');
    expect(phaseCellValue('points', counts, 'per_game')).toBe('7.5');
    expect(phaseCellValue('game_started', counts, 'per_game')).toBe('3');
    expect(phaseCellValue('minutes_played', counts, 'aggregate')).toBe('80');
    expect(phaseCellValue('minutes_played', counts, 'per_game')).toBe('20:00');
    expect(phaseCellValue('assists', counts, 'aggregate')).toBe('-');
    expect(phaseCellValue('points', row({ games: 0, sums: { points: 2 } }), 'per_game')).toBe('-');
  });
});

describe('gamesPlayedText', () => {
  it('counts the games in pt-BR', () => {
    expect(gamesPlayedText(0)).toBe('');
    expect(gamesPlayedText(1)).toBe('1 jogo disputado');
    expect(gamesPlayedText(7)).toBe('7 jogos disputados');
  });
});

describe('athleteSocialLinks', () => {
  it('links every network with a handle, without the @', () => {
    expect(athleteSocialLinks({ instagram: ' @ana ', twitter: '', facebook: 'ana.fb' })).toEqual([
      { network: 'instagram', url: 'https://instagram.com/ana' },
      { network: 'facebook', url: 'https://facebook.com/ana.fb' },
    ]);
    expect(athleteSocialLinks({ instagram: null })).toEqual([]);
  });
});
