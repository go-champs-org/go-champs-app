import { PinnedTournamentsRepository } from '../repositories/PinnedTournamentsRepository';

export class TogglePinnedTournamentUseCase {
  constructor(private readonly pinnedTournamentsRepository: PinnedTournamentsRepository) {}

  async execute(tournamentId: string): Promise<string[]> {
    const current = await this.pinnedTournamentsRepository.getPinnedIds();
    const isPinned = current.includes(tournamentId);
    const next = isPinned
      ? current.filter((id) => id !== tournamentId)
      : [tournamentId, ...current.filter((id) => id !== tournamentId)];

    await this.pinnedTournamentsRepository.savePinnedIds(next);
    return next;
  }
}
