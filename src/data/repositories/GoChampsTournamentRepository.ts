import { API_CONFIG } from '../../core/config/apiConfig';
import { Game, GameResponse } from '../../models/GameModel';
import { GameDetail, GameDetailResponse, PlayerStatsLog, PlayerStatsLogResponse } from '../../models/GameDetail';
import { PhaseData, PhaseResponse } from '../../models/PhaseModel';
import { StatLeadersGroup, StatLeadersResponse } from '../../models/StatLeaders';
import { Tournament } from '../../models/Tournament';
import { TournamentHistory } from '../../models/TournamentHistory';
import { TournamentRepository } from '../../domain/repositories/TournamentRepository';
import { TournamentFallbackDataSource } from '../datasources/local/TournamentFallbackDataSource';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import { ApiResponse, RecentlyViewedItemDto } from '../dto/ApiResponses';
import { mapRecentlyViewedToTournaments, mapTournamentHistoryResponse } from '../mappers/TournamentMapper';

export class GoChampsTournamentRepository implements TournamentRepository {
  constructor(
    private readonly apiClient: GoChampsApiClient,
    private readonly fallbackDataSource: TournamentFallbackDataSource
  ) {}

  async getRecentTournaments(): Promise<Tournament[]> {
    try {
      const response = await this.apiClient.get<ApiResponse<RecentlyViewedItemDto<Tournament>[]>>(
        '/recently-view',
        API_CONFIG.goChampsBaseUrl
      );
      return mapRecentlyViewedToTournaments(response.data, API_CONFIG.goChampsBaseUrl);
    } catch {
      try {
        const response = await this.apiClient.get<ApiResponse<RecentlyViewedItemDto<Tournament>[]>>(
          '/v1/recently-view',
          API_CONFIG.stagingBaseUrl
        );
        return mapRecentlyViewedToTournaments(response.data, `${API_CONFIG.stagingBaseUrl}/v1`);
      } catch {
        return [];
      }
    }
  }

  async getTournamentHistory(id: string, apiBaseUrl?: string): Promise<TournamentHistory> {
    const response = await this.apiClient.get<TournamentHistory | TournamentHistory['data']>(
      `/tournaments/${id}`,
      apiBaseUrl
    );
    return mapTournamentHistoryResponse(response);
  }

  async getPhase(phaseId: string, apiBaseUrl?: string): Promise<PhaseData> {
    const response = await this.apiClient.get<PhaseResponse>(`/phases/${phaseId}`, apiBaseUrl);
    return {
      ...response.data,
      elimination_stats: response.data.elimination_stats ?? [],
      eliminations: response.data.eliminations ?? [],
      draws: response.data.draws ?? [],
    };
  }

  async getGamesByPhaseId(phaseId: string, apiBaseUrl?: string): Promise<Game[]> {
    try {
      const response = await this.apiClient.get<GameResponse>(`/games?where[phase_id]=${phaseId}`, apiBaseUrl);
      return response.data;
    } catch {
      return this.fallbackDataSource.getGames();
    }
  }

  async getStatLeaders(tournamentId: string, statKeys: string[], apiBaseUrl?: string): Promise<StatLeadersGroup[]> {
    const stats = statKeys.map((key) => `&stats[]=${key}`).join('');
    const response = await this.apiClient.get<StatLeadersResponse>(
      `/aggregated-player-stats-leaders?where[tournament_id]=${tournamentId}${stats}`,
      apiBaseUrl
    );
    return response.data ?? [];
  }

  async getGameById(gameId: string, apiBaseUrl?: string): Promise<GameDetail> {
    const response = await this.apiClient.get<GameDetailResponse>(`/games/${gameId}`, apiBaseUrl);
    return {
      ...response.data,
      assets: response.data.assets ?? [],
      officials: response.data.officials ?? [],
      home_team: response.data.home_team
        ? { ...response.data.home_team, players: response.data.home_team.players ?? [] }
        : null,
      away_team: response.data.away_team
        ? { ...response.data.away_team, players: response.data.away_team.players ?? [] }
        : null,
    };
  }

  async getPlayerStatsLogsByGameId(gameId: string, apiBaseUrl?: string): Promise<PlayerStatsLog[]> {
    const response = await this.apiClient.get<PlayerStatsLogResponse>(
      `/player-stats-logs?where[game_id]=${gameId}`,
      apiBaseUrl
    );
    return response.data ?? [];
  }
}
