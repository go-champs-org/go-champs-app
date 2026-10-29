export interface PinnedTournamentsRepository {
  getPinnedIds(): Promise<string[]>;
  savePinnedIds(ids: string[]): Promise<void>;
}
