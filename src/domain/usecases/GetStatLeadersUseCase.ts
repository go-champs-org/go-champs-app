import { TournamentRepository } from '../repositories/TournamentRepository';
import { TournamentOverview } from './GetTournamentOverviewUseCase';
import { LeaderCard, leaderCards, leaderStatsFor } from './shared/statLeaders';

export class GetStatLeadersUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // A tournament without aggregated stats, or a sport without a list, makes
  // no request at all.
  async execute(tournament: TournamentOverview, apiBaseUrl?: string): Promise<LeaderCard[]> {
    if (!tournament.hasAggregatedPlayerStats) return [];
    const stats = leaderStatsFor(tournament.sportSlug, tournament.playerStats);
    if (stats.length === 0) return [];

    const groups = await this.tournamentRepository.getStatLeaders(
      tournament.id,
      stats.map((stat) => stat.slug),
      apiBaseUrl
    );
    return leaderCards(stats, groups, tournament.teams);
  }
}
