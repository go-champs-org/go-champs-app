import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetTournamentStatsUseCase } from '../GetTournamentStatsUseCase';
import { TournamentOverview } from '../GetTournamentOverviewUseCase';

const tournament = {
  id: 't1',
  teams: [{ id: 'team-a', name: 'Alpha', logo_url: null, tri_code: 'ALP' }],
  players: [{ id: 'p1', name: 'Ana', photo_url: null, team_id: 'team-a' }],
} as TournamentOverview;

describe('GetTournamentStatsUseCase', () => {
  it('requests the ranking and joins it with the roster', async () => {
    const getAggregatedPlayerStats = jest.fn().mockResolvedValue([{ id: 'l1', player_id: 'p1', stats: { points: 12 } }]);
    const useCase = new GetTournamentStatsUseCase({ getAggregatedPlayerStats } as unknown as TournamentRepository);
    const query = { sort: 'points', teamId: 'team-a' };

    await expect(useCase.execute(tournament, query, 'https://api.test/v1')).resolves.toEqual([
      { playerId: 'p1', name: 'Ana', photoUrl: null, team: { id: 'team-a', name: 'Alpha', logoUrl: null }, stats: { points: 12 } },
    ]);
    expect(getAggregatedPlayerStats).toHaveBeenCalledWith('t1', query, 'https://api.test/v1');
  });
});
