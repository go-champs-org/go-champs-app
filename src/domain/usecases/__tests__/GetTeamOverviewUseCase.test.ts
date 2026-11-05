import { AppError } from '../../../core/errors/AppError';
import { TournamentHistory } from '../../../models/TournamentHistory';
import { gamesFixture, tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetTeamOverviewUseCase, TEAM_NOT_FOUND } from '../GetTeamOverviewUseCase';

const API = 'https://api.test/v1';

const history = (data: Partial<TournamentHistory['data']> = {}): TournamentHistory => ({
  data: {
    ...tournamentHistoryFixture.data,
    id: 't1',
    name: 'Liga',
    sport_slug: 'basketball_5x5',
    player_stats: [
      { id: 's1', slug: 'points', title: 'Points', is_default_order: null },
      { id: 's2', slug: 'points_per_game', title: 'Points per game', is_default_order: null },
      { id: 's3', slug: 'field_goal_percentage', title: 'FG%', is_default_order: null },
    ],
    teams: [
      {
        id: 'team-a',
        name: 'Alpha',
        logo_url: 'https://logo/a.png',
        tri_code: 'ALP',
        players: [],
        coaches: [{ id: 'c1', name: 'Rui', type: 'head_coach' }],
      },
      { id: 'team-b', name: 'Beta', players: [] },
    ],
    players: [
      {
        id: 'p1',
        name: 'Ana',
        shirt_number: '7',
        team_id: 'team-a',
        photo_url: null,
        facebook: null,
        instagram: null,
        registration_response: null,
        shirt_name: null,
        twitter: null,
        username: null,
      },
    ],
    ...data,
  },
});

const repositoryWith = (overrides: Partial<Record<keyof TournamentRepository, jest.Mock>> = {}) => {
  const repository = {
    getTournamentHistory: jest.fn().mockResolvedValue(history()),
    getGamesByTeamId: jest.fn().mockResolvedValue(gamesFixture),
    getAggregatedPlayerStats: jest.fn().mockResolvedValue([
      { id: 'l1', player_id: 'p1', stats: { points: 20, points_per_game: 10, field_goal_percentage: 50 } },
    ]),
    ...overrides,
  };
  return { repository, useCase: new GetTeamOverviewUseCase(repository as unknown as TournamentRepository) };
};

describe('GetTeamOverviewUseCase', () => {
  it('loads the team, its roster numbers, staff and schedule', async () => {
    const { repository, useCase } = repositoryWith();
    const overview = await useCase.execute('t1', 'team-a', API);

    expect(repository.getTournamentHistory).toHaveBeenCalledWith('t1', API);
    expect(repository.getGamesByTeamId).toHaveBeenCalledWith('team-a', API);
    expect(repository.getAggregatedPlayerStats).toHaveBeenCalledWith('t1', { teamId: 'team-a' }, API);
    expect(overview.tournamentId).toBe('t1');
    expect(overview.tournamentName).toBe('Liga');
    expect(overview.team).toEqual({ id: 'team-a', name: 'Alpha', logoUrl: 'https://logo/a.png', triCode: 'ALP' });
    expect(overview.coaches).toEqual([{ id: 'c1', name: 'Rui', label: 'Treinador principal' }]);
    expect(overview.roster.scopes).toEqual(['aggregate', 'per_game']);
    expect(overview.roster.columnsByScope.aggregate?.map((column) => column.key)).toEqual(['points', 'field_goal_percentage']);
    expect(overview.roster.columnsByScope.per_game?.map((column) => column.key)).toEqual(['points_per_game']);
    expect(overview.roster.totalsByScope).toEqual({ aggregate: { points: '20' }, per_game: {} });
    expect(overview.roster.defaultSortByScope).toEqual({ aggregate: 'points', per_game: 'points_per_game' });
    expect(overview.roster.rows).toEqual([
      { playerId: 'p1', name: 'Ana', number: '7', photoUrl: undefined, stats: { points: '20', points_per_game: '10', field_goal_percentage: '50' } },
    ]);
    expect(overview.gameDays.map((day) => day.key)).toEqual(['2026-01-02', '2026-01-01']);
  });

  it('keeps the roster when the schedule or the numbers fail', async () => {
    const { useCase } = repositoryWith({
      getGamesByTeamId: jest.fn().mockRejectedValue(new Error('down')),
      getAggregatedPlayerStats: jest.fn().mockRejectedValue(new Error('down')),
    });
    const overview = await useCase.execute('t1', 'team-a');

    expect(overview.gameDays).toEqual([]);
    expect(overview.roster.rows[0].stats).toEqual({});
    expect(overview.roster.totalsByScope.aggregate).toEqual({});
  });

  it('reads a tournament with no stats as Totais with no columns', async () => {
    const { useCase } = repositoryWith({
      getTournamentHistory: jest.fn().mockResolvedValue(history({ player_stats: undefined as never, sport_slug: '' as never })),
    });
    const overview = await useCase.execute('t1', 'team-b');

    expect(overview.team).toEqual({ id: 'team-b', name: 'Beta', logoUrl: null, triCode: null });
    expect(overview.coaches).toEqual([]);
    expect(overview.roster).toEqual({ rows: [], scopes: ['aggregate'], columnsByScope: {}, totalsByScope: {}, defaultSortByScope: {} });
  });

  it('fails as not found for a team the tournament does not list', async () => {
    const { useCase } = repositoryWith({
      getTournamentHistory: jest.fn().mockResolvedValue(history({ teams: undefined as never, players: undefined as never })),
    });
    const failure = useCase.execute('t1', 'team-z');

    await expect(failure).rejects.toEqual(new AppError(TEAM_NOT_FOUND, 404));
    await expect(failure).rejects.toHaveProperty('status', 404);
  });
});
