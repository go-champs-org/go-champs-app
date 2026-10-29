import { PinnedTournamentsRepository } from '../repositories/PinnedTournamentsRepository';

export class GetPinnedTournamentIdsUseCase {
  constructor(private readonly pinnedTournamentsRepository: PinnedTournamentsRepository) {}

  execute() {
    return this.pinnedTournamentsRepository.getPinnedIds();
  }
}
