import { AppError } from '../../core/errors/AppError';
import { BoxScoreRow } from '../../models/GameDetail';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { StatScope } from './shared/statLeaders';
import { GameDay, LabelledCoach, labelCoaches, rosterTotals, teamGameDays, teamRosterRows } from './shared/teamPresentation';
import { defaultStatKey, StatColumn, statColumnsFor } from './shared/tournamentStats';

export const TEAM_NOT_FOUND = 'Time não encontrado neste campeonato.';

export type TeamRoster = {
  rows: BoxScoreRow[];
  // The scopes with columns of their own; a tournament that publishes no
  // stat still has its roster, read as Totais with no columns.
  scopes: StatScope[];
  columnsByScope: Partial<Record<StatScope, StatColumn[]>>;
  totalsByScope: Partial<Record<StatScope, Record<string, string>>>;
  // The column each scope opens ranked by, best first; null keeps the
  // roster's shirt-number order.
  defaultSortByScope: Partial<Record<StatScope, string | null>>;
};

export type TeamOverview = {
  tournamentId: string;
  tournamentName: string;
  team: { id: string; name: string; logoUrl: string | null; triCode: string | null };
  coaches: LabelledCoach[];
  roster: TeamRoster;
  gameDays: GameDay[];
};

const SCOPES: StatScope[] = ['aggregate', 'per_game'];

export class GetTeamOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // The schedule and the numbers are companions to the roster: an endpoint
  // that fails leaves the team standing, with no games or a dash in every
  // column, the way the public team page degrades.
  async execute(tournamentId: string, teamId: string, apiBaseUrl?: string): Promise<TeamOverview> {
    const [history, games, logs] = await Promise.all([
      this.tournamentRepository.getTournamentHistory(tournamentId, apiBaseUrl),
      this.tournamentRepository.getGamesByTeamId(teamId, apiBaseUrl).catch(() => []),
      this.tournamentRepository.getAggregatedPlayerStats(tournamentId, { teamId }, apiBaseUrl).catch(() => []),
    ]);
    const { data } = history;
    // Teams only exist inside their tournament: one it no longer lists is gone.
    const team = (data.teams ?? []).find((candidate) => candidate.id === teamId);
    if (!team) throw new AppError(TEAM_NOT_FOUND, 404);

    // The columns are the tournament stats screen's: a team's numbers read the
    // same as the ranking they come from.
    const columnsByScope: TeamRoster['columnsByScope'] = {};
    SCOPES.forEach((scope) => {
      const columns = statColumnsFor(data.sport_slug || '', data.player_stats ?? [], scope);
      if (columns.length > 0) columnsByScope[scope] = columns;
    });
    const scopes = Object.keys(columnsByScope) as StatScope[];
    const rows = teamRosterRows(data.players ?? [], teamId, logs);

    return {
      tournamentId: data.id,
      tournamentName: data.name,
      team: { id: team.id, name: team.name, logoUrl: team.logo_url || null, triCode: team.tri_code || null },
      coaches: labelCoaches(team.coaches),
      roster: {
        rows,
        scopes: scopes.length > 0 ? scopes : ['aggregate'],
        columnsByScope,
        totalsByScope: Object.fromEntries(
          scopes.map((scope) => [scope, rosterTotals(rows, (columnsByScope[scope] ?? []).map((column) => column.key))])
        ),
        defaultSortByScope: Object.fromEntries(scopes.map((scope) => [scope, defaultStatKey({ columnsByScope }, scope)])),
      },
      gameDays: teamGameDays(games),
    };
  }
}
