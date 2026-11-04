import { API_CONFIG } from '../../core/config/apiConfig';
import { AppError } from '../../core/errors/AppError';
import { HttpClient } from '../../core/http/HttpClient';
import { LiveScoreRepository } from '../../domain/repositories/LiveScoreRepository';
import { ScoreboardGameResponse } from '../../models/ScoreboardGame';

// Reads the scoreboard directly, without the API client, so the signed-in
// athlete's token never leaves for another service.
export class GoChampsScoreboardRepository implements LiveScoreRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly baseUrl = API_CONFIG.scoreboardBaseUrl
  ) {}

  async getScoreboardGame(gameId: string): Promise<ScoreboardGameResponse> {
    const response = await this.httpClient.request<ScoreboardGameResponse>({
      endpoint: `${this.baseUrl}/games/${gameId}`,
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new AppError(`HTTP error! status: ${response.status}`, response.status);
    return response.data;
  }
}
