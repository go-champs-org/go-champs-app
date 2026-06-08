import { Elimination, EliminationStat } from '../../models/EliminationModel';
import { Game } from '../../models/GameModel';
import { GroupPhaseData } from '../../models/GroupPhaseModel';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { buildTeamMap, sortGamesByDate, sortStatsByRanking, TeamInfo, TeamMap } from './shared/phasePresentation';

export type GroupRow = {
  group: Elimination;
  rows: Array<{
    team: TeamInfo;
    stats: Record<string, string | number>;
  }>;
};

export type GroupPhaseOverview = {
  groupPhaseData: GroupPhaseData;
  groups: GroupRow[];
  sortedStats: EliminationStat[];
  games: Game[];
  teamMap: TeamMap;
};

export class GetGroupPhaseOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(phaseId: string, tournamentId?: string, apiBaseUrl?: string): Promise<GroupPhaseOverview> {
    const [groupPhaseData, gamesResponse] = await Promise.all([
      this.tournamentRepository.getGroupPhaseData(phaseId, apiBaseUrl),
      this.tournamentRepository.getGamesByPhaseId(phaseId, apiBaseUrl),
    ]);

    const tournament = tournamentId
      ? await this.tournamentRepository.getTournamentDetails(tournamentId, apiBaseUrl).catch(() => undefined)
      : undefined;
    const games = sortGamesByDate(gamesResponse);
    const teamMap = buildTeamMap(games, tournament, { includeLogos: true });
    const sortedStats = sortStatsByRanking(groupPhaseData.elimination_stats);

    const groups = [...groupPhaseData.eliminations]
      .sort((a, b) => a.order - b.order)
      .map((group) => {
        const rows = group.team_stats
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
          });

        return { group, rows };
      });

    return {
      groupPhaseData,
      groups,
      sortedStats,
      games,
      teamMap,
    };
  }
}
