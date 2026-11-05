import { boxScoreRows, buildBoxScoreTeam, playersById, teamTotals } from '../BoxScoreMapper';
import { PlayerStatsLog } from '../../../models/GameDetail';

const log = (player_id: string, team_id: string, stats: PlayerStatsLog['stats'], shirt_number?: string | null): PlayerStatsLog => ({
  id: `log-${player_id}`,
  game_id: 'game-1',
  phase_id: null,
  player_id,
  team_id,
  tournament_id: null,
  shirt_number,
  stats,
});

describe('BoxScoreMapper', () => {
  const players = playersById([
    { id: 'p1', name: 'Ana Silva', shirt_name: 'ANA', photo_url: 'https://example.com/ana.png' },
    { id: 'p2', name: 'Bia Costa' },
    { id: 'p3', name: '' },
  ]);

  it('names an athlete by the shirt name first', () => {
    expect(players.get('p1')).toEqual({ name: 'ANA', photoUrl: 'https://example.com/ana.png' });
    expect(players.get('p2')).toEqual({ name: 'Bia Costa', photoUrl: '' });
  });

  it('maps each log to a line with its stats as strings', () => {
    expect(
      boxScoreRows([log('p1', 'a', { points: 12, rebounds: '4', assists: null }, '7'), log('ghost', 'a', {}, null)], players)
    ).toEqual([
      { playerId: 'p1', name: 'ANA', photoUrl: 'https://example.com/ana.png', number: '7', stats: { points: '12', rebounds: '4' } },
      { playerId: 'ghost', name: '', photoUrl: '', number: undefined, stats: {} },
    ]);
  });

  it('reads a team without a totals log as empty', () => {
    const teamLogs = [{ id: 't1', game_id: 'game-1', team_id: 'a', stats: { points: '80' } }];
    expect(teamTotals(teamLogs, 'a')).toEqual({ points: '80' });
    expect(teamTotals(teamLogs, 'b')).toEqual({});
  });

  it('builds one side of the box score', () => {
    const logs = [log('p1', 'a', { points: '10' }), log('p2', 'b', { points: '8' })];
    const team = { id: 'a', name: 'Alpha', logo_url: 'https://example.com/a.png', tri_code: null, players: [] };
    expect(buildBoxScoreTeam(team, 'A definir', logs, [], players)).toEqual({
      teamId: 'a',
      teamName: 'Alpha',
      logoUrl: 'https://example.com/a.png',
      rows: [expect.objectContaining({ playerId: 'p1' })],
      totals: {},
    });
    expect(buildBoxScoreTeam(null, 'Vencedor A', logs, [], players)).toEqual({
      teamId: '',
      teamName: 'Vencedor A',
      logoUrl: null,
      rows: [],
      totals: {},
    });
  });
});
