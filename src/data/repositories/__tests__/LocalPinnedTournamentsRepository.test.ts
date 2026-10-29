import { LocalPinnedTournamentsRepository } from '../LocalPinnedTournamentsRepository';
import { PinnedTournamentsLocalStore } from '../../datasources/local/PinnedTournamentsLocalStore';

describe('LocalPinnedTournamentsRepository', () => {
  it('delegates load and save to the local store', async () => {
    const store = {
      loadIds: jest.fn(async () => ['t1']),
      saveIds: jest.fn(async () => undefined),
    } as unknown as PinnedTournamentsLocalStore;

    const repository = new LocalPinnedTournamentsRepository(store);
    await expect(repository.getPinnedIds()).resolves.toEqual(['t1']);
    await repository.savePinnedIds(['t2']);
    expect(store.saveIds).toHaveBeenCalledWith(['t2']);
  });
});
