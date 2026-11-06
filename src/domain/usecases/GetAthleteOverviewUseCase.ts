import { AppError } from '../../core/errors/AppError';
import { TournamentHistory } from '../../models/TournamentHistory';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { athleteSocialLinks, athleteStatColumns, gamesPlayedText, SocialLink } from './shared/athleteProfile';
import { StatScope } from './shared/statLeaders';
import { StatColumn } from './shared/tournamentStats';

export const ATHLETE_NOT_FOUND = 'Atleta não encontrado neste campeonato.';

// One line of the stats table — a phase, or the whole tournament — as the API
// aggregated it: every stat, its per-game average and the games played.
export type AthleteStatsLine = {
  phaseId: string;
  label: string;
  stats: Record<string, string | number | null>;
};

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
  // The scopes with columns of their own, in toggle order.
  scopes: StatScope[];
  columnsByScope: Partial<Record<StatScope, StatColumn[]>>;
  // One line per phase the API has numbers for, in phase order.
  rows: AthleteStatsLine[];
  // The whole tournament; null when the API has nothing for the athlete.
  total: AthleteStatsLine | null;
  // A line and a column to read it in; otherwise the card says there are no
  // stats yet.
  hasStats: boolean;
};

const SCOPES: StatScope[] = ['aggregate', 'per_game'];

const isNotFound = (error: unknown) => error instanceof AppError && error.status === 404;

export class GetAthleteOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  // The athlete is the page: one the API does not know is not found. The
  // tournament and the numbers only fill it in — a failure there leaves the
  // banner standing with an empty stats card, the way the public page degrades.
  async execute(tournamentId: string, playerId: string, apiBaseUrl?: string): Promise<AthleteOverview> {
    const [athlete, history] = await Promise.all([
      this.tournamentRepository.getPlayer(playerId, apiBaseUrl).catch((error: unknown) => {
        throw isNotFound(error) ? new AppError(ATHLETE_NOT_FOUND, 404) : error;
      }),
      this.tournamentRepository.getTournamentHistory(tournamentId, apiBaseUrl).catch((): TournamentHistory | null => null),
    ]);
    const data = history?.data;
    const phases = [...(data?.phases ?? [])].sort((left, right) => left.order - right.order);

    // The athlete's numbers are read, never worked out: the whole tournament
    // and each phase are their own aggregated request.
    const lineOf = (phaseId: string, label: string) =>
      this.tournamentRepository
        .getAggregatedPlayerStats(tournamentId, { playerId, phaseId: phaseId || null }, apiBaseUrl)
        .then((logs): AthleteStatsLine | null => {
          const log = logs.find((candidate) => candidate.player_id === playerId);
          return log ? { phaseId, label, stats: log.stats ?? {} } : null;
        })
        .catch(() => null);
    const [total, ...phaseLines] = await Promise.all([
      lineOf('', 'Total'),
      ...phases.map((phase) => lineOf(phase.id, phase.title)),
    ]);
    const rows = phaseLines.filter((line): line is AthleteStatsLine => line !== null);

    const columnsByScope: AthleteOverview['columnsByScope'] = {};
    SCOPES.forEach((scope) => {
      const columns = athleteStatColumns(data?.sport_slug ?? '', data?.player_stats ?? [], scope);
      if (columns.length > 0) columnsByScope[scope] = columns;
    });
    const scopes = Object.keys(columnsByScope) as StatScope[];
    const team = athlete.team_id ? (data?.teams ?? []).find((candidate) => candidate.id === athlete.team_id) : undefined;

    return {
      tournamentId,
      tournamentName: data?.name ?? '',
      athlete: { id: athlete.id, name: athlete.name, photoUrl: athlete.photo_url || null },
      team: team ? { id: team.id, name: team.name } : null,
      gamesText: gamesPlayedText(Number(total?.stats.game_played) || 0),
      socialLinks: athleteSocialLinks(athlete),
      scopes,
      columnsByScope,
      rows,
      total,
      hasStats: Boolean(total) && rows.length > 0 && scopes.length > 0,
    };
  }
}
