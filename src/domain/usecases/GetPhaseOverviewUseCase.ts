import { Draw } from '../../models/PlayoffModel';
import { Game } from '../../models/GameModel';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { TournamentTeam } from './GetTournamentOverviewUseCase';
import { buildTeamMap, PhaseKind, sortGamesByDate, TeamInfo, TeamMap, teamShortName } from './shared/phasePresentation';
import { StandingsColumn, standingsColumns } from './shared/standingsPresentation';

export type StandingsRow = {
  id: string;
  team: TeamInfo;
  shortName: string;
  values: Record<string, string>;
};

export type StandingsGroup = {
  id: string;
  title: string | null;
  rows: StandingsRow[];
};

type PhaseOverviewBase = {
  games: Game[];
  teamMap: TeamMap;
};

export type PhaseOverview =
  | (PhaseOverviewBase & {
      kind: 'standings';
      columns: StandingsColumn[];
      groups: StandingsGroup[];
    })
  | (PhaseOverviewBase & {
      kind: 'bracket';
      draws: Draw[];
    });

const UNDECIDED_TEAM = 'A definir';

export class GetPhaseOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(
    phaseId: string,
    kind: PhaseKind,
    teams: TournamentTeam[],
    apiBaseUrl?: string
  ): Promise<PhaseOverview> {
    const [phase, gamesResponse] = await Promise.all([
      this.tournamentRepository.getPhase(phaseId, apiBaseUrl),
      // The games are a companion to the phase: an unreachable endpoint
      // leaves the standings standing with an empty list.
      this.tournamentRepository.getGamesByPhaseId(phaseId, apiBaseUrl).catch(() => [] as Game[]),
    ]);
    const games = sortGamesByDate(gamesResponse);
    const teamMap = buildTeamMap(games, teams);

    if (kind === 'bracket') {
      return { kind, games, teamMap, draws: [...phase.draws].sort((a, b) => a.order - b.order) };
    }

    const columns = standingsColumns(phase.elimination_stats);
    // The API already ranks each group's team stats; the order is kept as is.
    const groups = [...phase.eliminations]
      .sort((a, b) => a.order - b.order)
      .map((elimination) => ({
        id: elimination.id,
        title: elimination.title,
        rows: elimination.team_stats.map((teamStat) => ({
          id: teamStat.id,
          team: teamMap[teamStat.team_id] || { name: teamStat.placeholder || UNDECIDED_TEAM, logo_url: null },
          shortName: teamShortName(teamMap[teamStat.team_id], teamStat.placeholder, UNDECIDED_TEAM),
          values: Object.fromEntries(
            columns.map((column) => [column.id, String(teamStat.stats[column.id] ?? '-')])
          ),
        })),
      }));

    return { kind, games, teamMap, columns, groups };
  }
}
