import { AggregatedPlayerStatsQuery } from '../../models/AggregatedPlayerStats';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { TournamentOverview } from './GetTournamentOverviewUseCase';
import { TournamentStatsRow, tournamentStatsRows } from './shared/tournamentStats';

export class GetTournamentStatsUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // One ranking of the tournament's athletes, narrowed by the query and
  // joined with the roster for names, photos and teams.
  async execute(
    tournament: TournamentOverview,
    query: AggregatedPlayerStatsQuery,
    apiBaseUrl?: string
  ): Promise<TournamentStatsRow[]> {
    const logs = await this.tournamentRepository.getAggregatedPlayerStats(tournament.id, query, apiBaseUrl);
    return tournamentStatsRows(logs, tournament.players, tournament.teams);
  }
}
