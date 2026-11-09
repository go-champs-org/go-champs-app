import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  AccountIdentity,
  AccountIdentityRepository,
  AccountIdentityWrite,
} from '../../domain/repositories/AccountIdentityRepository';

type ApiAccountIdentityResponse = {
  data: AccountIdentity;
};

const ENDPOINT = '/account-identity';
const SESSION_EXPIRED = 'Sessão expirada. Entre novamente para ver seu perfil.';
const LOAD_FAILED = 'Não foi possível carregar seus dados de identidade.';
const SAVE_FAILED = 'Não foi possível salvar seus dados de identidade.';
const INVALID_FIELDS = 'Confira os campos destacados.';

const isAuthError = (error: AppError) => error.status === 401 || error.status === 403;

export class GoChampsAccountIdentityRepository implements AccountIdentityRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async get(): Promise<AccountIdentity | null> {
    try {
      const response = await this.apiClient.get<ApiAccountIdentityResponse>(ENDPOINT);
      return response.data ?? null;
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      if (error instanceof AppError && isAuthError(error)) throw new AppError(SESSION_EXPIRED, error.status);
      throw new AppError(LOAD_FAILED, error instanceof AppError ? error.status : undefined);
    }
  }

  create(input: AccountIdentityWrite): Promise<AccountIdentity> {
    return this.write(() => this.apiClient.post<ApiAccountIdentityResponse>(ENDPOINT, { account_identity: input }));
  }

  update(input: AccountIdentityWrite): Promise<AccountIdentity> {
    return this.write(() => this.apiClient.put<ApiAccountIdentityResponse>(ENDPOINT, { account_identity: input }));
  }

  private async write(request: () => Promise<ApiAccountIdentityResponse>): Promise<AccountIdentity> {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      if (!(error instanceof AppError)) throw new AppError(SAVE_FAILED);
      if (error.status === 422) throw new AppError(INVALID_FIELDS, 422, error.fields);
      if (isAuthError(error)) throw new AppError(SESSION_EXPIRED, error.status);
      throw new AppError(SAVE_FAILED, error.status);
    }
  }
}
