import { AppError } from '../../../core/errors/AppError';
import { HttpClient } from '../../../core/http/HttpClient';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsAccountIdentityRepository } from '../GoChampsAccountIdentityRepository';

const request = jest.fn();
const httpClient = { request } as unknown as HttpClient;
const repository = new GoChampsAccountIdentityRepository(new GoChampsApiClient(httpClient, { getToken: () => 'tok' }));

const identity = {
  id: 'i1',
  full_legal_name: 'Ana Silva',
  tax_id_type: 'CPF',
  tax_id_last4: '4725',
  government_id_type: null,
  government_id_last4: null,
  date_of_birth: '1997-05-21',
};

describe('GoChampsAccountIdentityRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the signed-in identity with the bearer token', async () => {
    request.mockResolvedValue({ ok: true, status: 200, data: { data: identity } });
    await expect(repository.get()).resolves.toEqual(identity);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/account-identity',
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer tok' }),
      })
    );
  });

  it('returns null when there is no identity', async () => {
    request.mockResolvedValue({ ok: false, status: 404, data: { errors: { detail: 'Not Found' } } });
    await expect(repository.get()).resolves.toBeNull();
    request.mockResolvedValue({ ok: true, status: 200, data: { data: null } });
    await expect(repository.get()).resolves.toBeNull();
  });

  it('maps load failures', async () => {
    request.mockResolvedValue({ ok: false, status: 401, data: {} });
    await expect(repository.get()).rejects.toEqual(
      new AppError('Sessão expirada. Entre novamente para ver seu perfil.', 401)
    );
    request.mockResolvedValue({ ok: false, status: 500, data: {} });
    await expect(repository.get()).rejects.toEqual(
      new AppError('Não foi possível carregar seus dados de identidade.', 500)
    );
    request.mockRejectedValue(new TypeError('Network request failed'));
    await expect(repository.get()).rejects.toEqual(new AppError('Não foi possível carregar seus dados de identidade.'));
  });

  it('creates with POST and updates with PUT, wrapped in account_identity', async () => {
    request.mockResolvedValue({ ok: true, status: 201, data: { data: identity } });
    await expect(repository.create({ full_legal_name: 'Ana Silva' })).resolves.toEqual(identity);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/account-identity',
        method: 'POST',
        body: { account_identity: { full_legal_name: 'Ana Silva' } },
      })
    );

    request.mockResolvedValue({ ok: true, status: 200, data: { data: identity } });
    await expect(repository.update({ tax_id_type: 'CPF', tax_id: '52998224725' })).resolves.toEqual(identity);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PUT',
        body: { account_identity: { tax_id_type: 'CPF', tax_id: '52998224725' } },
      })
    );
  });

  it('keeps field errors on validation failures', async () => {
    request.mockResolvedValue({ ok: false, status: 422, data: { errors: { tax_id: ['is invalid'] } } });
    const error = await repository.update({ tax_id: '1' }).catch((caught: AppError) => caught);
    expect(error).toEqual(new AppError('Confira os campos destacados.', 422));
    expect((error as AppError).fields).toEqual({ tax_id: ['is invalid'] });
  });

  it('maps other save failures', async () => {
    request.mockResolvedValue({ ok: false, status: 403, data: {} });
    await expect(repository.create({})).rejects.toEqual(
      new AppError('Sessão expirada. Entre novamente para ver seu perfil.', 403)
    );
    request.mockResolvedValue({ ok: false, status: 500, data: {} });
    await expect(repository.create({})).rejects.toEqual(
      new AppError('Não foi possível salvar seus dados de identidade.', 500)
    );
    request.mockRejectedValue(new TypeError('Network request failed'));
    await expect(repository.update({})).rejects.toEqual(
      new AppError('Não foi possível salvar seus dados de identidade.')
    );
  });
});
