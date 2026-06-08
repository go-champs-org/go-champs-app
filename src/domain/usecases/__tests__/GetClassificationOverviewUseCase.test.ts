import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetClassificationOverviewUseCase } from '../GetClassificationOverviewUseCase';
import {
  classificationDataFixture,
  gamesFixture,
  tournamentDetailsFixture,
} from '../../../test/fixtures/tournamentFixtures';

const createRepository = (): TournamentRepository =>
  ({
    getClassificationData: jest.fn().mockResolvedValue(classificationDataFixture),
    getGamesByPhaseId: jest.fn().mockResolvedValue(gamesFixture),
    getTournamentDetails: jest.fn().mockResolvedValue(tournamentDetailsFixture),
  }) as unknown as TournamentRepository;

describe('GetClassificationOverviewUseCase', () => {
  it('builds ordered classification rows with team data', async () => {
    const overview = await new GetClassificationOverviewUseCase(createRepository()).execute(
      'phase-classification',
      'tournament-1'
    );

    expect(overview.classificationRows.map((row) => row.team.name)).toEqual(['Beta', 'Alpha']);
    expect(overview.sortedStats.map((stat) => stat.id)).toEqual(['wins']);
    expect(overview.games.map((game) => game.id)).toEqual(['game-1', 'game-2']);
  });

  it('handles phases without eliminations or tournament id', async () => {
    const repository = createRepository();
    jest.mocked(repository.getClassificationData).mockResolvedValue({
      ...classificationDataFixture,
      eliminations: [],
      elimination_stats: [],
    });

    const overview = await new GetClassificationOverviewUseCase(repository).execute('phase-classification');

    expect(repository.getTournamentDetails).not.toHaveBeenCalled();
    expect(overview.classificationRows).toEqual([]);
    expect(overview.sortedStats).toEqual([]);
  });
});
