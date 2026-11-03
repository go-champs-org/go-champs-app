import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetStatLeadersUseCase } from '../GetStatLeadersUseCase';
import { TournamentOverview } from '../GetTournamentOverviewUseCase';

const tournament: TournamentOverview = {
  id: 'tournament-1',
  name: 'Copa',
  logoUrl: null,
  organizationName: 'Org',
  isActive: true,
  teams: [{ id: 'team-a', name: 'Alpha', logo_url: null }],
  phases: [],
  defaultPhaseId: null,
  hasAggregatedPlayerStats: true,
  sportSlug: 'basketball_5x5',
  playerStats: [{ slug: 'points', title: 'PTS' }, { slug: 'assists', title: 'AST' }],
};

describe('GetStatLeadersUseCase', () => {
  const getStatLeaders = jest.fn();
  const useCase = new GetStatLeadersUseCase({ getStatLeaders } as unknown as TournamentRepository);
  beforeEach(() => getStatLeaders.mockReset());

  it('requests the highlighted stats in one call and builds cards', async () => {
    getStatLeaders.mockResolvedValue([
      { stat_key: 'points', leaders: [{ player_id: 'p1', team_id: 'team-a', value: 30, player: { name: 'Ana', photo_url: 'https://example.com/ana.png' } }] },
    ]);
    const cards = await useCase.execute(tournament, 'https://api.test/v1');
    expect(getStatLeaders).toHaveBeenCalledWith('tournament-1', ['points', 'assists'], 'https://api.test/v1');
    expect(cards).toEqual([{
      slug: 'points',
      title: 'Pontos',
      leaders: [{ playerId: 'p1', playerName: 'Ana', photoUrl: 'https://example.com/ana.png', teamName: 'Alpha', value: '30' }],
    }]);
  });

  it.each([
    { hasAggregatedPlayerStats: false },
    { sportSlug: 'futsal' },
  ])('makes no request when there is nothing to rank (%o)', async (change) => {
    await expect(useCase.execute({ ...tournament, ...change })).resolves.toEqual([]);
    expect(getStatLeaders).not.toHaveBeenCalled();
  });
});
