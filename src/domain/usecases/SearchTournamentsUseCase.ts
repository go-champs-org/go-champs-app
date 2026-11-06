import { Tournament } from '../../models/Tournament';
import { TournamentRepository } from '../repositories/TournamentRepository';

export class SearchTournamentsUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // A blank term asks nothing, like the public /api/search route.
  execute(term: string): Promise<Tournament[]> {
    const value = term.trim();
    if (!value) return Promise.resolve([]);
    return this.tournamentRepository.searchTournaments(value);
  }
}
