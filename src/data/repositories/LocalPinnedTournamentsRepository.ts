import { PinnedTournamentsRepository } from '../../domain/repositories/PinnedTournamentsRepository';
import { PinnedTournamentsLocalStore } from '../datasources/local/PinnedTournamentsLocalStore';

export class LocalPinnedTournamentsRepository implements PinnedTournamentsRepository {
  constructor(private readonly store: PinnedTournamentsLocalStore) {}

  getPinnedIds() {
    return this.store.loadIds();
  }

  savePinnedIds(ids: string[]) {
    return this.store.saveIds(ids);
  }
}
