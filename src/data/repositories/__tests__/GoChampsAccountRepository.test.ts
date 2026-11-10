import { AppError } from '../../../core/errors/AppError';
import { HttpClient } from '../../../core/http/HttpClient';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { DeleteAccountError } from '../../../domain/repositories/AccountRepository';
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

  describe('deleteAccount', () => {
    const deleteFailure = async () =>
      (await new GoChampsAccountRepository(apiClient)
        .deleteAccount('secret')
        .catch((caught: DeleteAccountError) => caught)) as DeleteAccountError;

    it('sends the password to DELETE /accounts and resolves on 204', async () => {
      request.mockResolvedValue({ ok: true, status: 204, data: null });

      await expect(new GoChampsAccountRepository(apiClient).deleteAccount('secret')).resolves.toBeUndefined();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://api.go-champs.com/v1/accounts',
          method: 'DELETE',
          body: { password: 'secret' },
        })
      );
    });

    it('tells a wrong password apart and keeps it out of the session-expired path', async () => {
      request.mockResolvedValue({ ok: false, status: 401, data: { error: 'invalid_password' } });

      const error = await deleteFailure();
      expect(error).toBeInstanceOf(DeleteAccountError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.reason).toBe('invalid_password');
      expect(error.message).toBe('Senha incorreta.');
      expect(error.status).toBe(401);
    });

    it.each(['unauthenticated', 'no_resource_found', 'invalid_token', undefined])(
      'treats any other 401 (%s) as an expired session',
      async (code) => {
        request.mockResolvedValue({ ok: false, status: 401, data: code ? { error: code } : {} });

        const error = await deleteFailure();
        expect(error.reason).toBe('session_expired');
        expect(error.message).toBe('Sessão expirada. Entre novamente para excluir sua conta.');
      }
    );

    it('lists the organizations the user is the sole owner of', async () => {
      request.mockResolvedValue({
        ok: false,
        status: 409,
        data: {
          error: 'account_owns_organizations',
          organizations: [
            { id: 'o1', name: 'Federação Paulista', slug: 'fpb', extra: 'dropped' },
            { id: 'o2', name: 'Liga Norte', slug: 'liga-norte' },
            { id: 'o3' },
          ],
        },
      });

      const error = await deleteFailure();
      expect(error.reason).toBe('owns_organizations');
      expect(error.status).toBe(409);
      expect(error.organizations).toEqual([
        { id: 'o1', name: 'Federação Paulista', slug: 'fpb' },
        { id: 'o2', name: 'Liga Norte', slug: 'liga-norte' },
      ]);
      expect(error.message).toBe(
        'Você é o único dono destas organizações: Federação Paulista, Liga Norte. Adicione outro dono ou exclua as organizações antes de excluir sua conta.'
      );
    });

    it('copes with a 409 without an organization list', async () => {
      request.mockResolvedValue({ ok: false, status: 409, data: { error: 'account_owns_organizations' } });

      const error = await deleteFailure();
      expect(error.reason).toBe('owns_organizations');
      expect(error.organizations).toEqual([]);
    });

    it.each([
      [500, {}],
      [409, { error: 'other_conflict' }],
      [403, {}],
    ])('maps an unexpected %s to the generic failure', async (status, data) => {
      request.mockResolvedValue({ ok: false, status, data });

      const error = await deleteFailure();
      expect(error.reason).toBe('failed');
      expect(error.status).toBe(status);
      expect(error.message).toBe('Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.');
    });

    it('maps a network failure to the generic failure', async () => {
      request.mockRejectedValue(new TypeError('Network request failed'));

      const error = await deleteFailure();
      expect(error.reason).toBe('failed');
      expect(error.status).toBeUndefined();
      expect(error.message).toBe('Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.');
    });
  });
});
