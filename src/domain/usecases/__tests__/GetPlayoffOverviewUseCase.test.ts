import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetPlayoffOverviewUseCase } from '../GetPlayoffOverviewUseCase';
import {
  gamesFixture,
  playoffResponseFixture,
  tournamentDetailsFixture,
} from '../../../test/fixtures/tournamentFixtures';

const createRepository = (): TournamentRepository =>
  ({
    getTournamentDetails: jest.fn().mockResolvedValue(tournamentDetailsFixture),
    getPlayoffData: jest.fn().mockResolvedValue(playoffResponseFixture),
    getGamesByPhaseId: jest.fn().mockResolvedValue(gamesFixture),
    getSportConfig: jest.fn().mockResolvedValue({ name: 'Basketball', slug: 'basketball' }),
  }) as unknown as TournamentRepository;

describe('GetPlayoffOverviewUseCase', () => {
  it('selects playoff phase and sorts draws and games', async () => {
    const repository = createRepository();
    const useCase = new GetPlayoffOverviewUseCase(repository);

    const overview = await useCase.execute('tournament-1');

    expect(repository.getPlayoffData).toHaveBeenCalledWith('phase-playoff', undefined);
    expect(overview.draws.map((draw) => draw.id)).toEqual(['draw-1', 'draw-2']);
    expect(overview.games.map((game) => game.id)).toEqual(['game-1', 'game-2']);
    expect(overview.teamMap['team-a'].name).toBe('Alpha');
  });

  it('falls back to first phase and skips sport preload when sport slug is missing', async () => {
    const repository = createRepository();
    jest.mocked(repository.getTournamentDetails).mockResolvedValue({
      ...tournamentDetailsFixture,
      phases: [{ id: 'phase-first', title: null, type: null }],
      sport_slug: undefined,
    });

    const overview = await new GetPlayoffOverviewUseCase(repository).execute('tournament-1');

    expect(repository.getPlayoffData).toHaveBeenCalledWith('phase-first', undefined);
    expect(repository.getSportConfig).not.toHaveBeenCalled();
    expect(overview.draws).toHaveLength(2);
  });

  it('uses the selected phase when provided', async () => {
    const repository = createRepository();

    await new GetPlayoffOverviewUseCase(repository).execute('tournament-1', undefined, 'phase-selected');

    expect(repository.getPlayoffData).toHaveBeenCalledWith('phase-selected', undefined);
    expect(repository.getGamesByPhaseId).toHaveBeenCalledWith('phase-selected', undefined);
  });
});
