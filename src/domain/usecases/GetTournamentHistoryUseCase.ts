import { TournamentRepository } from '../repositories/TournamentRepository';

export class GetTournamentHistoryUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  execute(id: string, apiBaseUrl?: string) {
    return this.tournamentRepository.getTournamentHistory(id, apiBaseUrl);
  }
}
