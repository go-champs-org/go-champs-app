import { API_CONFIG } from '../../core/config/apiConfig';
import { ClassificationData, ClassificationResponse } from '../../models/ClassificationModel';
import { Game, GameResponse } from '../../models/GameModel';
import { GroupPhaseData, GroupPhaseResponse } from '../../models/GroupPhaseModel';
import { PlayoffResponse } from '../../models/PlayoffModel';
import { SportConfig, SportResponse } from '../../models/Sport';
import { Tournament } from '../../models/Tournament';
import { TournamentDetails, TournamentDetailsResponse } from '../../models/TournamentDetails';
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

  async getTournamentDetails(tournamentId: string, apiBaseUrl?: string): Promise<TournamentDetails> {
    try {
      const response = await this.apiClient.get<TournamentDetailsResponse>(`/tournaments/${tournamentId}`, apiBaseUrl);
      return response.data;
    } catch {
      return this.fallbackDataSource.getTournamentDetails();
    }
  }

  async getPlayoffData(phaseId: string, apiBaseUrl?: string): Promise<PlayoffResponse> {
    try {
      return await this.apiClient.get<PlayoffResponse>(`/phases/${phaseId}`, apiBaseUrl);
    } catch {
      return this.fallbackDataSource.getPlayoffData();
    }
  }

  async getGamesByPhaseId(phaseId: string, apiBaseUrl?: string): Promise<Game[]> {
    try {
      const response = await this.apiClient.get<GameResponse>(`/games?where[phase_id]=${phaseId}`, apiBaseUrl);
      return response.data;
    } catch {
      return this.fallbackDataSource.getGames();
    }
  }

  async getSportConfig(sportSlug: string, apiBaseUrl?: string): Promise<SportConfig> {
    try {
      const response = await this.apiClient.get<SportResponse>(`/sports/${sportSlug}`, apiBaseUrl);
      return response.data;
    } catch {
      return this.fallbackDataSource.getSportConfig();
    }
  }

  async getClassificationData(phaseId: string, apiBaseUrl?: string): Promise<ClassificationData> {
    const response = await this.apiClient.get<ClassificationResponse>(`/phases/${phaseId}`, apiBaseUrl);
    return response.data;
  }

  async getGroupPhaseData(phaseId: string, apiBaseUrl?: string): Promise<GroupPhaseData> {
    const response = await this.apiClient.get<GroupPhaseResponse>(`/phases/${phaseId}`, apiBaseUrl);
    return response.data;
  }
}
