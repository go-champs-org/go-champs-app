import { AppError } from '../../core/errors/AppError';
import { TournamentHistory } from '../../models/TournamentHistory';
import { TournamentRepository } from '../repositories/TournamentRepository';
import {
  AthletePhaseTable,
  athletePhaseTable,
  athleteProfileColumns,
  athleteSocialLinks,
  gamesPlayedText,
  SocialLink,
} from './shared/athleteProfile';
import { StatColumn } from './shared/tournamentStats';

export const ATHLETE_NOT_FOUND = 'Atleta não encontrado neste campeonato.';

export type AthleteOverview = {
  tournamentId: string;
  // Empty when the tournament could not be read: the banner stands without it.
  tournamentName: string;
  athlete: { id: string; name: string; photoUrl: string | null };
  // Null for an athlete with no team, or one the tournament no longer lists:
  // there is no team screen to open.
  team: { id: string; name: string } | null;
  gamesText: string;
  socialLinks: SocialLink[];
  columns: StatColumn[];
  table: AthletePhaseTable;
  // A phase with a game and a column to read it in; otherwise the card says
  // there are no stats yet.
  hasStats: boolean;
};

const isNotFound = (error: unknown) => error instanceof AppError && error.status === 404;

export class GetAthleteOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // The athlete is the page: one the API does not know is not found. The
  // tournament and the game logs only fill it in — a failure there leaves the
  // banner standing with an empty stats card, the way the public page degrades.
  async execute(tournamentId: string, playerId: string, apiBaseUrl?: string): Promise<AthleteOverview> {
    const [athlete, history, logs] = await Promise.all([
      this.tournamentRepository.getPlayer(playerId, apiBaseUrl).catch((error: unknown) => {
        throw isNotFound(error) ? new AppError(ATHLETE_NOT_FOUND, 404) : error;
      }),
      this.tournamentRepository.getTournamentHistory(tournamentId, apiBaseUrl).catch((): TournamentHistory | null => null),
      this.tournamentRepository.getPlayerStatsLogsByPlayerId(playerId, apiBaseUrl).catch(() => []),
    ]);
    const data = history?.data;
    const team = athlete.team_id ? (data?.teams ?? []).find((candidate) => candidate.id === athlete.team_id) : undefined;
    const columns = athleteProfileColumns(data?.sport_slug ?? '', data?.player_stats ?? []);
    const table = athletePhaseTable(logs, data?.phases ?? []);

    return {
      tournamentId,
      tournamentName: data?.name ?? '',
      athlete: { id: athlete.id, name: athlete.name, photoUrl: athlete.photo_url || null },
      team: team ? { id: team.id, name: team.name } : null,
      gamesText: gamesPlayedText(table.total.games),
      socialLinks: athleteSocialLinks(athlete),
      columns,
      table,
      hasStats: table.rows.length > 0 && columns.length > 0,
    };
  }
}
