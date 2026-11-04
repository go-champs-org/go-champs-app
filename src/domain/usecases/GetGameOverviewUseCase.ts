import { GameDetail, GameOverview, PlayerStatsLog } from '../../models/GameDetail';
import { TournamentHistory } from '../../models/TournamentHistory';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { buildBoxScoreTeam, playersById } from '../../data/mappers/BoxScoreMapper';
import { boxScoreColumns, boxScoreRanking, shouldShowBoxScore } from './shared/boxScore';

// The tournament names the sport, the box score's columns, the athletes and
// whether the game goes live; the logs fill the box score in. Each is a
// companion to the game, as on the public page: one that fails leaves the
// game without it rather than taking the screen down.
export class GetGameOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(gameId: string, apiBaseUrl?: string): Promise<GameOverview> {
    const [game, logs, teamLogs] = await Promise.all([
      this.tournamentRepository.getGameById(gameId, apiBaseUrl),
      this.tournamentRepository.getPlayerStatsLogsByGameId(gameId, apiBaseUrl).catch(() => []),
      this.tournamentRepository.getTeamStatsLogsByGameId(gameId, apiBaseUrl).catch(() => []),
    ]);
    const tournament = await this.loadTournament(game, apiBaseUrl);
    const sportSlug = tournament?.sport_slug || '';
    const liveSiteUpdate = tournament?.scoreboard_setting?.live_site_update || null;
    const columns = boxScoreColumns(sportSlug, tournament?.player_stats ?? []);
    const visible = columns.length > 0 && shouldShowBoxScore(game.live_state, liveSiteUpdate, logs.length);
    const players = playersById([
      ...(game.home_team?.players ?? []),
      ...(game.away_team?.players ?? []),
      ...(tournament?.players ?? []),
    ]);

    return {
      game,
      sportSlug,
      liveSiteUpdate,
      boxScore: visible
        ? {
            columns,
            ranking: boxScoreRanking(sportSlug),
            home: buildBoxScoreTeam(game.home_team, game.home_placeholder || 'A definir', logs, teamLogs, players),
            away: buildBoxScoreTeam(game.away_team, game.away_placeholder || 'A definir', logs, teamLogs, players),
          }
        : null,
    };
  }

  private async loadTournament(game: GameDetail, apiBaseUrl?: string): Promise<TournamentHistory['data'] | null> {
    const tournamentId = game.phase?.tournament?.id;
    if (!tournamentId) return null;
    try {
      return (await this.tournamentRepository.getTournamentHistory(tournamentId, apiBaseUrl)).data;
    } catch {
      return null;
    }
  }
}

export type { GameDetail, PlayerStatsLog, GameOverview };
