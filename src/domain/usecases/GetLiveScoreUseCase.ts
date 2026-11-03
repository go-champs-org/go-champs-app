import { LiveScoreRepository } from '../repositories/LiveScoreRepository';
import { LiveScoreUpdate, toLiveScoreUpdate } from './shared/liveScore';

export class GetLiveScoreUseCase {
  constructor(private readonly repository: LiveScoreRepository) {}

  async execute(gameId: string): Promise<LiveScoreUpdate> {
    return toLiveScoreUpdate(await this.repository.getScoreboardGame(gameId));
  }
}
