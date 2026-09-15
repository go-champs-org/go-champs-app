import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  AthleteProfile,
  AthleteProfileInput,
  AthleteProfileRepository,
  ScheduleGame,
} from '../../domain/repositories/AthleteProfileRepository';

type ApiAthleteResponse = {
  data: AthleteProfile;
};

type ApiSchedulesResponse = {
  data: ScheduleGame[];
};

export class GoChampsAthleteProfileRepository implements AthleteProfileRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async getByUsername(username: string): Promise<AthleteProfile | null> {
    try {
      const response = await this.apiClient.get<ApiAthleteResponse>(
        `/athlete-profiles/username/${encodeURIComponent(username)}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AppError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(input: AthleteProfileInput): Promise<AthleteProfile> {
    const response = await this.apiClient.post<ApiAthleteResponse>('/athlete-profiles', {
      athlete_profile: input,
    });
    return response.data;
  }

  async updateByUsername(username: string, input: AthleteProfileInput): Promise<AthleteProfile> {
    const response = await this.apiClient.patch<ApiAthleteResponse>(
      `/athlete-profiles/username/${encodeURIComponent(username)}`,
      { athlete_profile: input }
    );
    return response.data;
  }

  async getMySchedules(): Promise<ScheduleGame[]> {
    try {
      const response = await this.apiClient.get<ApiSchedulesResponse>('/athlete-profiles/me/schedules');
      return response.data;
    } catch (error) {
      if (error instanceof AppError && error.status === 401) {
        throw new AppError('Complete seu perfil de atleta para ver sua agenda.', 401);
      }
      throw error;
    }
  }
}
