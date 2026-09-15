import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  AccountRepository,
  AuthenticatedUser,
  SignInCredentials,
  UserAccountProfile,
} from '../../domain/repositories/AccountRepository';

type ApiUserResponse = {
  data: AuthenticatedUser;
};

type ApiAccountProfileResponse = {
  data: UserAccountProfile;
};

export class GoChampsAccountRepository implements AccountRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async signIn(credentials: SignInCredentials): Promise<AuthenticatedUser> {
    try {
      const response = await this.apiClient.post<ApiUserResponse>('/accounts/signin', credentials);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw new AppError(
          error.message.startsWith('HTTP error!')
            ? 'Não foi possível entrar. Verifique seus dados e tente novamente.'
            : error.message,
          error.status
        );
      }
      throw new AppError('Não foi possível entrar. Verifique seus dados e tente novamente.');
    }
  }

  async getAccountProfile(username: string): Promise<UserAccountProfile> {
    try {
      const response = await this.apiClient.get<ApiAccountProfileResponse>(
        `/users/${encodeURIComponent(username)}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw new AppError(
          error.status === 401 || error.status === 403
            ? 'Sessão expirada. Entre novamente para ver seu perfil.'
            : 'Não foi possível carregar seu perfil.',
          error.status
        );
      }
      throw new AppError('Não foi possível carregar seu perfil.');
    }
  }
}
