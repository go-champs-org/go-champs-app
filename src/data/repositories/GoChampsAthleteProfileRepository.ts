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

  create(input: AthleteProfileInput): Promise<AthleteProfile> {
    return this.write(() =>
      this.apiClient.post<ApiAthleteResponse>('/athlete-profiles', { athlete_profile: input })
    );
  }

  updateByUsername(username: string, input: AthleteProfileInput): Promise<AthleteProfile> {
    return this.write(() =>
      this.apiClient.patch<ApiAthleteResponse>(`/athlete-profiles/username/${encodeURIComponent(username)}`, {
        athlete_profile: input,
      })
    );
  }

  private async write(request: () => Promise<ApiAthleteResponse>): Promise<AthleteProfile> {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      if (error instanceof AppError && error.status === 422) {
        throw new AppError('Confira os campos destacados.', 422, error.fields);
      }
      throw new AppError(
        'Não foi possível salvar o perfil de atleta.',
        error instanceof AppError ? error.status : undefined
      );
    }
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
