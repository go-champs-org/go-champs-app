import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  AthleteProfile,
  AthleteProfileInput,
  AthleteProfileRepository,
  AthleteRecentGame,
  AthleteTeamGame,
} from '../../domain/repositories/AthleteProfileRepository';

type ApiAthleteResponse = {
  data: AthleteProfile;
};

type ApiListResponse<T> = {
  data: T[];
};

const usernamePath = (username: string) => `/athlete-profiles/username/${encodeURIComponent(username)}`;

export class GoChampsAthleteProfileRepository implements AthleteProfileRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async getByUsername(username: string): Promise<AthleteProfile | null> {
    try {
      const response = await this.apiClient.get<ApiAthleteResponse>(usernamePath(username));
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
      this.apiClient.patch<ApiAthleteResponse>(usernamePath(username), {
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

  async getTeamSchedule(username: string): Promise<AthleteTeamGame[]> {
    const response = await this.apiClient.get<ApiListResponse<AthleteTeamGame>>(`${usernamePath(username)}/schedules`);
    return response.data;
  }

  async getRecentGames(username: string): Promise<AthleteRecentGame[]> {
    const response = await this.apiClient.get<ApiListResponse<AthleteRecentGame>>(
      `${usernamePath(username)}/recent-games`
    );
    return response.data;
  }
}
