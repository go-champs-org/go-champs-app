import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  AccountRepository,
  AuthenticatedUser,
  DeleteAccountError,
  SignInCredentials,
  SoleOwnedOrganization,
  UserAccountProfile,
} from '../../domain/repositories/AccountRepository';

type ApiUserResponse = {
  data: AuthenticatedUser;
};

type ApiAccountProfileResponse = {
  data: UserAccountProfile;
};

const DELETE_FAILED_MESSAGE = 'Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.';

const soleOwnedOrganizationsFrom = (data: unknown): SoleOwnedOrganization[] => {
  const organizations = (data as { organizations?: unknown } | undefined)?.organizations;
  if (!Array.isArray(organizations)) return [];
  return organizations
    .filter((organization): organization is SoleOwnedOrganization => typeof organization?.name === 'string')
    .map(({ id, name, slug }) => ({ id, name, slug }));
};

/** Maps the `DELETE /accounts` failures (GC-389) to what the app does next. */
const deleteAccountErrorFrom = (error: unknown): DeleteAccountError => {
  if (!(error instanceof AppError)) return new DeleteAccountError('failed', DELETE_FAILED_MESSAGE);
  if (error.status === 401 && error.code === 'invalid_password') {
    return new DeleteAccountError('invalid_password', 'Senha incorreta.', 401);
  }
  // Any other 401 (expired token, account already gone): the session is dead.
  if (error.status === 401) {
    return new DeleteAccountError('session_expired', 'Sessão expirada. Entre novamente para excluir sua conta.', 401);
  }
  if (error.status === 409 && error.code === 'account_owns_organizations') {
    const organizations = soleOwnedOrganizationsFrom(error.data);
    const names = organizations.map(({ name }) => name).join(', ');
    return new DeleteAccountError(
      'owns_organizations',
      `Você é o único dono destas organizações: ${names}. Adicione outro dono ou exclua as organizações antes de excluir sua conta.`,
      409,
      organizations
    );
  }
  return new DeleteAccountError('failed', DELETE_FAILED_MESSAGE, error.status);
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

  async deleteAccount(password: string): Promise<void> {
    try {
      await this.apiClient.delete<null>('/accounts', { password });
    } catch (error) {
      throw deleteAccountErrorFrom(error);
    }
  }
}
