import { TournamentRepository } from '../repositories/TournamentRepository';

export class GetRecentTournamentsUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  execute() {
    return this.tournamentRepository.getRecentTournaments();
  }
}

