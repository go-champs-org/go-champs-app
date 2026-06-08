import { ClassificationData } from '../../models/ClassificationModel';
import { EliminationStat } from '../../models/EliminationModel';
import { Game } from '../../models/GameModel';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { buildTeamMap, sortGamesByDate, sortStatsByRanking, TeamInfo, TeamMap } from './shared/phasePresentation';

export type ClassificationRow = {
  team: TeamInfo;
  stats: Record<string, string | number>;
};

export type ClassificationOverview = {
  classificationData: ClassificationData;
  classificationRows: ClassificationRow[];
  sortedStats: EliminationStat[];
  games: Game[];
  teamMap: TeamMap;
};

export class GetClassificationOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(phaseId: string, tournamentId?: string, apiBaseUrl?: string): Promise<ClassificationOverview> {
    const [classificationData, gamesResponse] = await Promise.all([
      this.tournamentRepository.getClassificationData(phaseId, apiBaseUrl),
      this.tournamentRepository.getGamesByPhaseId(phaseId, apiBaseUrl),
    ]);

    const tournament = tournamentId
      ? await this.tournamentRepository.getTournamentDetails(tournamentId, apiBaseUrl).catch(() => undefined)
      : undefined;
    const games = sortGamesByDate(gamesResponse);
    const teamMap = buildTeamMap(games, tournament, { includeLogos: true });
    const sortedStats = sortStatsByRanking(classificationData.elimination_stats);
    const elimination = classificationData.eliminations[0];

    const classificationRows = elimination
      ? elimination.team_stats
          .map((teamStat) => {
            const team = teamMap[teamStat.team_id] || {
              name: teamStat.placeholder || 'Time',
              logo_url: null,
            };
            const stats: Record<string, string | number> = {};
            sortedStats.forEach((stat) => {
              stats[stat.id] = teamStat.stats[stat.id] ?? 0;
            });

            return { team, stats };
          })
          .sort((a, b) => {
            const firstStat = sortedStats.find((stat) => stat.ranking_order > 0);
            if (!firstStat) return 0;
            return Number(b.stats[firstStat.id] ?? 0) - Number(a.stats[firstStat.id] ?? 0);
          })
      : [];

    return {
      classificationData,
      classificationRows,
      sortedStats,
      games,
      teamMap,
    };
  }
}
