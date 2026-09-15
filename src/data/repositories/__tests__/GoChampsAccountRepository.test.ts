import { AppError } from '../../../core/errors/AppError';
import { HttpClient } from '../../../core/http/HttpClient';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsAccountRepository } from '../GoChampsAccountRepository';

const request = jest.fn();
const httpClient = { request } as unknown as HttpClient;
const apiClient = new GoChampsApiClient(httpClient);

describe('GoChampsAccountRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts credentials to the authenticated account endpoint', async () => {
    request.mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { email: 'lucas@example.com', token: 'token', username: 'lucas' } },
    });

    await expect(new GoChampsAccountRepository(apiClient).signIn({ username: 'lucas', password: 'secret' })).resolves.toEqual({
      email: 'lucas@example.com',
      token: 'token',
      username: 'lucas',
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/accounts/signin',
        method: 'POST',
        body: { username: 'lucas', password: 'secret' },
      })
    );
  });

  it('turns an API failure into an app error', async () => {
    request.mockResolvedValue({ ok: false, status: 401, data: { errors: { detail: 'Credenciais inválidas' } } });

    await expect(new GoChampsAccountRepository(apiClient).signIn({ username: 'lucas', password: 'bad' })).rejects.toEqual(
      new AppError('Credenciais inválidas', 401)
    );
  });

  it('loads account profile for the authenticated username', async () => {
    request.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: {
          email: 'lucas@example.com',
          username: 'lucas',
          organizations: [{ id: '1', name: 'Org', slug: 'org', logo_url: null }],
        },
      },
    });

    await expect(new GoChampsAccountRepository(apiClient).getAccountProfile('lucas')).resolves.toEqual({
      email: 'lucas@example.com',
      username: 'lucas',
      organizations: [{ id: '1', name: 'Org', slug: 'org', logo_url: null }],
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/users/lucas',
        method: 'GET',
      })
    );
  });

  it('maps unauthorized profile errors', async () => {
    request.mockResolvedValue({ ok: false, status: 401, data: {} });
    await expect(new GoChampsAccountRepository(apiClient).getAccountProfile('lucas')).rejects.toEqual(
      new AppError('Sessão expirada. Entre novamente para ver seu perfil.', 401)
    );
  });

  it('maps generic profile errors', async () => {
    request.mockResolvedValue({ ok: false, status: 500, data: {} });
    await expect(new GoChampsAccountRepository(apiClient).getAccountProfile('lucas')).rejects.toEqual(
      new AppError('Não foi possível carregar seu perfil.', 500)
    );
  });

  it('maps generic sign-in http failures', async () => {
    request.mockResolvedValue({ ok: false, status: 503, data: {} });
    await expect(new GoChampsAccountRepository(apiClient).signIn({ username: 'lucas', password: 'bad' })).rejects.toEqual(
      new AppError('Não foi possível entrar. Verifique seus dados e tente novamente.', 503)
    );
  });
});
