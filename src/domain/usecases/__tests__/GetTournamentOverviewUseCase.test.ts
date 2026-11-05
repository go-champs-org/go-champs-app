import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetTournamentOverviewUseCase } from '../GetTournamentOverviewUseCase';
import { tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';
import { Phase } from '../../../models/TournamentHistory';

const phase = (id: string, type: string, order: number, is_in_progress = false, title: string | null = id): Phase =>
  ({ id, type, order, is_in_progress, title, elimination_stats: [] }) as unknown as Phase;

const execute = (data: Partial<typeof tournamentHistoryFixture.data>) => {
  const repository = {
    getTournamentHistory: jest.fn().mockResolvedValue({ data: { ...tournamentHistoryFixture.data, ...data } }),
  } as unknown as TournamentRepository;
  return { repository, run: () => new GetTournamentOverviewUseCase(repository).execute('tournament-1', 'https://api.test/v1') };
};

describe('GetTournamentOverviewUseCase', () => {
  it('lists supported phases by order and opens the one in progress', async () => {
    const { repository, run } = execute({
      logo_url: 'https://example.com/logo.png',
      has_aggregated_player_stats: true,
      sport_slug: 'basketball_5x5',
      phases: [phase('playoffs', 'draw', 3, true), phase('table', 'elimination', 1, false, null), phase('signup', 'registration', 0)],
      players: [
        { id: 'p1', name: 'Ana', photo_url: 'https://example.com/ana.png', team_id: 'a' },
        { id: 'p2', name: 'Bia', team_id: null },
      ] as never,
      teams: [{ id: 'b', name: 'Zebra', players: [] }, { id: 'a', name: 'Águias', logo_url: 'https://example.com/a.png', tri_code: 'AGU', players: [] }],
    });
    const overview = await run();

    expect(repository.getTournamentHistory).toHaveBeenCalledWith('tournament-1', 'https://api.test/v1');
    expect(overview.phases.map((item) => [item.id, item.title, item.kind])).toEqual([
      ['table', 'Fase', 'standings'],
      ['playoffs', 'playoffs', 'bracket'],
    ]);
    expect(overview.defaultPhaseId).toBe('playoffs');
    expect(overview.isActive).toBe(true);
    expect(overview.logoUrl).toBe('https://example.com/logo.png');
    expect(overview.organizationName).toBe('Go Champs');
    expect([overview.organizationSlug, overview.slug]).toEqual(['go-champs', 'copa-go-champs']);
    expect(overview.hasAggregatedPlayerStats).toBe(true);
    expect(overview.players).toEqual([
      { id: 'p1', name: 'Ana', photo_url: 'https://example.com/ana.png', team_id: 'a' },
      { id: 'p2', name: 'Bia', photo_url: null, team_id: null },
    ]);
    expect(overview.teams).toEqual([
      { id: 'a', name: 'Águias', logo_url: 'https://example.com/a.png', tri_code: 'AGU' },
      { id: 'b', name: 'Zebra', logo_url: null, tri_code: null },
    ]);
  });

  it('falls back to the first phase as returned when none is in progress', async () => {
    const overview = await execute({ phases: [phase('second', 'elimination', 2), phase('first', 'draw', 1)] }).run();
    expect(overview.defaultPhaseId).toBe('second');
    expect(overview.isActive).toBe(false);
  });

  it('tolerates a tournament without phases, teams or optional fields', async () => {
    const overview = await execute({
      phases: undefined, teams: undefined, players: undefined, player_stats: undefined, organization: undefined, sport_slug: undefined,
    } as never).run();
    expect(overview).toMatchObject({
      phases: [], teams: [], players: [], playerStats: [], defaultPhaseId: null, organizationName: '', organizationSlug: '', sportSlug: '', logoUrl: null,
    });
  });
});
