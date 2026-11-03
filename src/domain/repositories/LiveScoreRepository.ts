import { ScoreboardGameResponse } from '../../models/ScoreboardGame';

export interface LiveScoreRepository {
  getScoreboardGame(gameId: string): Promise<ScoreboardGameResponse>;
}
