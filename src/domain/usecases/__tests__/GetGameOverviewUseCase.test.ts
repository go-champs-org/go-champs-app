import { GetGameOverviewUseCase } from '../GetGameOverviewUseCase';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GameDetail } from '../../../models/GameDetail';

const game = (overrides: Partial<GameDetail> = {}): GameDetail => ({
  id: 'game-1',
  phase_id: 'p1',
  datetime: '2026-01-01T10:00:00.000Z',
  location: 'Court',
  city: null,
  court: null,
  number: null,
  result_type: null,
  home_score: 80,
  away_score: 70,
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
  home_team: { id: 'a', name: 'Alpha', logo_url: null, tri_code: null, players: [{ id: 'p1', name: 'Ana Silva', photo_url: 'https://example.com/ana.png' }] },
  away_team: { id: 'b', name: 'Beta', logo_url: null, tri_code: null, players: [] },
  phase: { id: 'p1', title: 'Fase', type: 'elimination', tournament: { id: 't1', name: 'Copa', slug: 'copa' } },
  ...overrides,
});

const tournament = (overrides: Record<string, unknown> = {}) => ({
  data: {
    sport_slug: 'basketball_5x5',
    scoreboard_setting: { live_site_update: 'full-live-update' },
    player_stats: [],
    players: [{ id: 'p1', name: 'Ana Silva', shirt_name: 'ANA' }],
    ...overrides,
  },
});

const logs = [
  { id: 'l1', game_id: 'game-1', phase_id: null, player_id: 'p1', team_id: 'a', tournament_id: null, shirt_number: '7', stats: { points: '20' } },
  { id: 'l2', game_id: 'game-1', phase_id: null, player_id: 'p2', team_id: 'b', tournament_id: null, stats: { points: '15' } },
];

const repositoryWith = (overrides: Partial<Record<keyof TournamentRepository, jest.Mock>> = {}) =>
  ({
    getGameById: jest.fn().mockResolvedValue(game()),
    getPlayerStatsLogsByGameId: jest.fn().mockResolvedValue(logs),
    getTeamStatsLogsByGameId: jest.fn().mockResolvedValue([{ id: 'tl', game_id: 'game-1', team_id: 'a', stats: { points: '80' } }]),
    getTournamentHistory: jest.fn().mockResolvedValue(tournament()),
    ...overrides,
  }) as unknown as TournamentRepository & Record<string, jest.Mock>;

describe('GetGameOverviewUseCase', () => {
  it('builds the box score from the logs, the tournament names and the team totals', async () => {
    const repository = repositoryWith();
    const result = await new GetGameOverviewUseCase(repository).execute('game-1', 'https://api.test/v1');

    expect(repository.getTournamentHistory).toHaveBeenCalledWith('t1', 'https://api.test/v1');
    expect(result.sportSlug).toBe('basketball_5x5');
    expect(result.liveSiteUpdate).toBe('full-live-update');
    expect(result.boxScore?.columns).toHaveLength(21);
    expect(result.boxScore?.ranking).toEqual(['game_started', 'minutes_played', 'points']);
    expect(result.boxScore?.home).toEqual({
      teamId: 'a',
      teamName: 'Alpha',
      logoUrl: null,
      rows: [{ playerId: 'p1', name: 'ANA', photoUrl: '', number: '7', stats: { points: '20' } }],
      totals: { points: '80' },
    });
    expect(result.boxScore?.away.rows).toEqual([{ playerId: 'p2', name: '', photoUrl: '', number: undefined, stats: { points: '15' } }]);
  });

  it('keeps a live game box score for full live updates even without logs', async () => {
    const repository = repositoryWith({
      getGameById: jest.fn().mockResolvedValue(game({ is_finished: false, live_state: 'in_progress', home_team: null, home_placeholder: 'Vencedor A' })),
      getPlayerStatsLogsByGameId: jest.fn().mockRejectedValue(new Error('offline')),
      getTeamStatsLogsByGameId: jest.fn().mockRejectedValue(new Error('offline')),
    });
    const result = await new GetGameOverviewUseCase(repository).execute('game-1');
    expect(result.boxScore?.home).toMatchObject({ teamName: 'Vencedor A', rows: [] });
  });

  it.each([
    ['a live game without full live updates', game({ live_state: 'in_progress', is_finished: false }), tournament({ scoreboard_setting: null })],
    ['a game whose sport has no columns', game(), tournament({ sport_slug: 'volleyball', player_stats: [] })],
  ])('has no box score for %s', async (_, detail, history) => {
    const repository = repositoryWith({
      getGameById: jest.fn().mockResolvedValue(detail),
      getTournamentHistory: jest.fn().mockResolvedValue(history),
    });
    expect((await new GetGameOverviewUseCase(repository).execute('game-1')).boxScore).toBeNull();
  });

  it('keeps the game when the tournament is unavailable', async () => {
    const repository = repositoryWith({ getTournamentHistory: jest.fn().mockRejectedValue(new Error('offline')) });
    const result = await new GetGameOverviewUseCase(repository).execute('game-1');
    expect(result).toMatchObject({ sportSlug: '', liveSiteUpdate: null, boxScore: null });
    expect(result.game.id).toBe('game-1');
  });

  it('does not look up a tournament the game does not name', async () => {
    const repository = repositoryWith({
      getGameById: jest.fn().mockResolvedValue(game({ phase: null, away_team: null })),
    });
    const result = await new GetGameOverviewUseCase(repository).execute('game-1');
    expect(repository.getTournamentHistory).not.toHaveBeenCalled();
    expect(result.boxScore).toBeNull();
  });

  it('propagates a failure to load the game itself', async () => {
    const repository = repositoryWith({ getGameById: jest.fn().mockRejectedValue(new Error('404')) });
    await expect(new GetGameOverviewUseCase(repository).execute('game-1')).rejects.toThrow('404');
  });
});
