import { GetPinnedTournamentIdsUseCase } from '../GetPinnedTournamentIdsUseCase';
import { TogglePinnedTournamentUseCase } from '../TogglePinnedTournamentUseCase';
import { PinnedTournamentsRepository } from '../../repositories/PinnedTournamentsRepository';

describe('pinned tournament use cases', () => {
  const createRepo = (initial: string[] = []): PinnedTournamentsRepository => {
    let ids = [...initial];
    return {
      getPinnedIds: jest.fn(async () => [...ids]),
      savePinnedIds: jest.fn(async (next) => {
        ids = [...next];
      }),
    };
  };

  it('reads pinned ids', async () => {
    const repo = createRepo(['t1']);
    const useCase = new GetPinnedTournamentIdsUseCase(repo);
    await expect(useCase.execute()).resolves.toEqual(['t1']);
  });

  it('pins a tournament at the front', async () => {
    const repo = createRepo(['t2']);
    const useCase = new TogglePinnedTournamentUseCase(repo);
    await expect(useCase.execute('t1')).resolves.toEqual(['t1', 't2']);
    expect(repo.savePinnedIds).toHaveBeenCalledWith(['t1', 't2']);
  });

  it('unpins an already pinned tournament', async () => {
    const repo = createRepo(['t1', 't2']);
    const useCase = new TogglePinnedTournamentUseCase(repo);
    await expect(useCase.execute('t1')).resolves.toEqual(['t2']);
  });
});
