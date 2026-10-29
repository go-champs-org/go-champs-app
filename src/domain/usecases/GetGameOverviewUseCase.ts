import { GameDetail, GameOverview, PlayerStatsLog } from '../../models/GameDetail';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { buildBoxScore } from '../../data/mappers/BoxScoreMapper';

export class GetGameOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(gameId: string, apiBaseUrl?: string): Promise<GameOverview> {
    const [game, logs] = await Promise.all([
      this.tournamentRepository.getGameById(gameId, apiBaseUrl),
      this.tournamentRepository.getPlayerStatsLogsByGameId(gameId, apiBaseUrl),
    ]);

    return {
      game,
      boxScore: buildBoxScore(game, logs),
    };
  }
}

export type { GameDetail, PlayerStatsLog, GameOverview };
