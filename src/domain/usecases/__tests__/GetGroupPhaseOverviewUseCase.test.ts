import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetGroupPhaseOverviewUseCase } from '../GetGroupPhaseOverviewUseCase';
import {
  gamesFixture,
  groupPhaseDataFixture,
  tournamentDetailsFixture,
} from '../../../test/fixtures/tournamentFixtures';

const createRepository = (): TournamentRepository =>
  ({
    getGroupPhaseData: jest.fn().mockResolvedValue(groupPhaseDataFixture),
    getGamesByPhaseId: jest.fn().mockResolvedValue(gamesFixture),
    getTournamentDetails: jest.fn().mockResolvedValue(tournamentDetailsFixture),
  }) as unknown as TournamentRepository;

describe('GetGroupPhaseOverviewUseCase', () => {
  it('sorts groups and keeps logos for group tables', async () => {
    const overview = await new GetGroupPhaseOverviewUseCase(createRepository()).execute(
      'phase-group',
      'tournament-1'
    );

    expect(overview.groups.map((group) => group.group.id)).toEqual(['group-b', 'group-a']);
    expect(overview.teamMap['team-a'].logo_url).toBe('https://example.com/alpha.png');
  });

  it('keeps row order when no ranked stat exists', async () => {
    const repository = createRepository();
    jest.mocked(repository.getGroupPhaseData).mockResolvedValue({
      ...groupPhaseDataFixture,
      elimination_stats: [{ id: 'draws', title: 'E', team_stat_source: 'manual', ranking_order: 0 }],
    });

    const overview = await new GetGroupPhaseOverviewUseCase(repository).execute('phase-group');

    expect(repository.getTournamentDetails).not.toHaveBeenCalled();
    expect(overview.groups[0].rows.map((row) => row.team.name)).toEqual(['Alpha', 'Beta']);
  });
});
