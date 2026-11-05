import { AppError } from '../../../core/errors/AppError';
import { TournamentHistory } from '../../../models/TournamentHistory';
import { tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { ATHLETE_NOT_FOUND, GetAthleteOverviewUseCase } from '../GetAthleteOverviewUseCase';

const API = 'https://api.test/v1';

const history = (): TournamentHistory => ({
  data: {
    ...tournamentHistoryFixture.data,
    id: 't1',
    name: 'Liga',
    sport_slug: 'basketball_5x5',
    player_stats: [
      { id: 's1', slug: 'points', title: 'Points', is_default_order: null },
      { id: 's2', slug: 'points_per_game', title: 'Points per game', is_default_order: null },
    ],
    phases: [{ id: 'ph1', title: 'Grupos', order: 1, type: 'standings', is_in_progress: false, elimination_stats: [] }],
    teams: [{ id: 'team-a', name: 'Alpha', players: [] }],
  },
});

const athlete = { id: 'p1', name: 'Ana', team_id: 'team-a', photo_url: 'https://photo/ana.png', instagram: '@ana' };

const repositoryWith = (overrides: Partial<Record<keyof TournamentRepository, jest.Mock>> = {}) => {
  const repository = {
    getPlayer: jest.fn().mockResolvedValue(athlete),
    getTournamentHistory: jest.fn().mockResolvedValue(history()),
    getPlayerStatsLogsByPlayerId: jest.fn().mockResolvedValue([
      { id: 'l1', game_id: 'g1', phase_id: 'ph1', player_id: 'p1', team_id: 'team-a', tournament_id: 't1', stats: { points: '12' } },
      { id: 'l2', game_id: 'g2', phase_id: 'ph1', player_id: 'p1', team_id: 'team-a', tournament_id: 't1', stats: { points: '8' } },
    ]),
    ...overrides,
  };
  return { repository, useCase: new GetAthleteOverviewUseCase(repository as unknown as TournamentRepository) };
};

describe('GetAthleteOverviewUseCase', () => {
  it('builds the banner and the per-phase stats', async () => {
    const { repository, useCase } = repositoryWith();
    const overview = await useCase.execute('t1', 'p1', API);

    expect(repository.getPlayer).toHaveBeenCalledWith('p1', API);
    expect(repository.getTournamentHistory).toHaveBeenCalledWith('t1', API);
    expect(repository.getPlayerStatsLogsByPlayerId).toHaveBeenCalledWith('p1', API);
    expect(overview).toMatchObject({
      tournamentId: 't1',
      tournamentName: 'Liga',
      athlete: { id: 'p1', name: 'Ana', photoUrl: 'https://photo/ana.png' },
      team: { id: 'team-a', name: 'Alpha' },
      gamesText: '2 jogos disputados',
      socialLinks: [{ network: 'instagram', url: 'https://instagram.com/ana' }],
      columns: [{ key: 'points', label: 'PTS', description: 'Pontos' }],
      hasStats: true,
    });
    expect(overview.table.rows).toEqual([
      { phaseId: 'ph1', label: 'Grupos', games: 2, sums: { points: 20 }, counts: { points: 2 } },
    ]);
  });

  it('leaves the banner standing when the tournament and logs fail', async () => {
    const { useCase } = repositoryWith({
      getPlayer: jest.fn().mockResolvedValue({ id: 'p1', name: 'Ana' }),
      getTournamentHistory: jest.fn().mockRejectedValue(new Error('offline')),
      getPlayerStatsLogsByPlayerId: jest.fn().mockRejectedValue(new Error('offline')),
    });
    const overview = await useCase.execute('t1', 'p1');

    expect(overview).toMatchObject({
      tournamentName: '',
      athlete: { photoUrl: null },
      team: null,
      gamesText: '',
      socialLinks: [],
      columns: [],
      hasStats: false,
    });
  });

  it('has no team for a team the tournament no longer lists', async () => {
    const { useCase } = repositoryWith({ getPlayer: jest.fn().mockResolvedValue({ ...athlete, team_id: 'gone' }) });
    await expect(useCase.execute('t1', 'p1')).resolves.toMatchObject({ team: null });
  });

  it('reports an athlete the API does not know as not found', async () => {
    const { useCase } = repositoryWith({ getPlayer: jest.fn().mockRejectedValue(new AppError('nope', 404)) });
    await expect(useCase.execute('t1', 'p1')).rejects.toMatchObject({ message: ATHLETE_NOT_FOUND, status: 404 });
  });

  it('propagates any other failure to read the athlete', async () => {
    const { useCase } = repositoryWith({ getPlayer: jest.fn().mockRejectedValue(new AppError('boom', 500)) });
    await expect(useCase.execute('t1', 'p1')).rejects.toMatchObject({ message: 'boom', status: 500 });
  });
});
