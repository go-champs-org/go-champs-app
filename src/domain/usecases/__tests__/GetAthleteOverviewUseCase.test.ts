import { AppError } from '../../../core/errors/AppError';
import { AggregatedPlayerStatsQuery } from '../../../models/AggregatedPlayerStats';
import { TournamentHistory } from '../../../models/TournamentHistory';
import { tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { ATHLETE_NOT_FOUND, GetAthleteOverviewUseCase } from '../GetAthleteOverviewUseCase';

const API = 'https://api.test/v1';

const phase = (id: string, title: string, order: number) => ({
  id, title, order, type: 'standings', is_in_progress: false, elimination_stats: [],
});

const history = (): TournamentHistory => ({
  data: {
    ...tournamentHistoryFixture.data,
    id: 't1',
    name: 'Liga',
    sport_slug: 'basketball_5x5',
    player_stats: [
      { id: 's0', slug: 'game_played', title: 'Games', is_default_order: null },
      { id: 's1', slug: 'points', title: 'Points', is_default_order: null },
      { id: 's2', slug: 'points_per_game', title: 'Points per game', is_default_order: null },
    ],
    phases: [phase('ph2', 'Playoffs', 2), phase('ph1', 'Temporada', 1), phase('ph3', 'Final', 3)],
    teams: [{ id: 'team-a', name: 'Alpha', players: [] }],
  },
});

const athlete = { id: 'p1', name: 'Ana', team_id: 'team-a', photo_url: 'https://photo/ana.png', instagram: '@ana' };

// The API's aggregate of the athlete: the whole tournament, or one phase.
const STATS: Record<string, Record<string, number>> = {
  '': { game_played: 9, points: 371, points_per_game: 41.2 },
  ph1: { game_played: 7, points: 307, points_per_game: 43.9 },
  ph2: { game_played: 2, points: 64, points_per_game: 32 },
};

const aggregated = jest.fn((_tournamentId: string, { phaseId }: AggregatedPlayerStatsQuery) => {
  const stats = STATS[phaseId ?? ''];
  return Promise.resolve(stats ? [{ id: `agg-${phaseId}`, player_id: 'p1', stats }] : []);
});

const repositoryWith = (overrides: Partial<Record<keyof TournamentRepository, jest.Mock>> = {}) => {
  const repository = {
    getPlayer: jest.fn().mockResolvedValue(athlete),
    getTournamentHistory: jest.fn().mockResolvedValue(history()),
    getAggregatedPlayerStats: aggregated,
    ...overrides,
  };
  return { repository, useCase: new GetAthleteOverviewUseCase(repository as unknown as TournamentRepository) };
};

describe('GetAthleteOverviewUseCase', () => {
  beforeEach(() => aggregated.mockClear());

  it('reads the tournament and each phase from the aggregated stats', async () => {
    const { repository, useCase } = repositoryWith();
    const overview = await useCase.execute('t1', 'p1', API);

    expect(repository.getPlayer).toHaveBeenCalledWith('p1', API);
    expect(repository.getTournamentHistory).toHaveBeenCalledWith('t1', API);
    expect(aggregated.mock.calls).toEqual([
      ['t1', { playerId: 'p1', phaseId: null }, API],
      ['t1', { playerId: 'p1', phaseId: 'ph1' }, API],
      ['t1', { playerId: 'p1', phaseId: 'ph2' }, API],
      ['t1', { playerId: 'p1', phaseId: 'ph3' }, API],
    ]);
    expect(overview).toMatchObject({
      tournamentId: 't1',
      tournamentName: 'Liga',
      athlete: { id: 'p1', name: 'Ana', photoUrl: 'https://photo/ana.png' },
      team: { id: 'team-a', name: 'Alpha' },
      gamesText: '9 jogos disputados',
      socialLinks: [{ network: 'instagram', url: 'https://instagram.com/ana' }],
      scopes: ['aggregate', 'per_game'],
      columnsByScope: {
        aggregate: [{ key: 'points', label: 'PTS', description: 'Pontos' }],
        per_game: [{ key: 'points_per_game', label: 'PTS', description: 'Pontos' }],
      },
      total: { phaseId: '', label: 'Total', stats: STATS[''] },
      hasStats: true,
    });
    // In phase order; a phase the API has nothing for is left out.
    expect(overview.rows).toEqual([
      { phaseId: 'ph1', label: 'Temporada', stats: STATS.ph1 },
      { phaseId: 'ph2', label: 'Playoffs', stats: STATS.ph2 },
    ]);
  });

  it('skips a phase whose request fails and ignores another athlete in the answer', async () => {
    const { useCase } = repositoryWith({
      getAggregatedPlayerStats: jest.fn((_t: string, { phaseId }: AggregatedPlayerStatsQuery) => {
        if (phaseId === 'ph1') return Promise.reject(new Error('offline'));
        if (phaseId === 'ph2') return Promise.resolve([{ id: 'x', player_id: 'someone-else', stats: {} }]);
        return Promise.resolve([{ id: 'agg', player_id: 'p1', stats: STATS[phaseId ?? ''] ?? {} }]);
      }),
    });
    const overview = await useCase.execute('t1', 'p1');
    expect(overview.rows.map((row) => row.phaseId)).toEqual(['ph3']);
    expect(overview.rows[0].stats).toEqual({});
  });

  it('leaves the banner standing when the tournament and stats fail', async () => {
    const { useCase } = repositoryWith({
      getPlayer: jest.fn().mockResolvedValue({ id: 'p1', name: 'Ana' }),
      getTournamentHistory: jest.fn().mockRejectedValue(new Error('offline')),
      getAggregatedPlayerStats: jest.fn().mockRejectedValue(new Error('offline')),
    });
    const overview = await useCase.execute('t1', 'p1');

    expect(overview).toMatchObject({
      tournamentName: '',
      athlete: { photoUrl: null },
      team: null,
      gamesText: '',
      socialLinks: [],
      scopes: [],
      rows: [],
      total: null,
      hasStats: false,
    });
  });

  it('reads a missing stats map as an empty one', async () => {
    const { useCase } = repositoryWith({
      getAggregatedPlayerStats: jest.fn().mockResolvedValue([{ id: 'agg', player_id: 'p1', stats: null }]),
    });
    const overview = await useCase.execute('t1', 'p1');
    expect(overview.total?.stats).toEqual({});
    expect(overview.gamesText).toBe('');
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
