import { AppError } from '../../../../core/errors/AppError';
import { HttpClient } from '../../../../core/http/HttpClient';
import { GoChampsApiClient } from '../GoChampsApiClient';

const createHttpClient = (response: Awaited<ReturnType<HttpClient['request']>>): HttpClient => ({
  request: jest.fn().mockResolvedValue(response),
});

describe('GoChampsApiClient', () => {
  it('requests endpoints with the configured base url', async () => {
    const httpClient = createHttpClient({
      ok: true,
      status: 200,
      data: { data: 'ok' },
    });
    const apiClient = new GoChampsApiClient(httpClient);

    await expect(apiClient.get('/tournaments/1')).resolves.toEqual({ data: 'ok' });

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/tournaments/1',
      })
    );
  });

  it('keeps absolute endpoints unchanged', async () => {
    const httpClient = createHttpClient({
      ok: true,
      status: 200,
      data: { data: 'ok' },
    });

    await new GoChampsApiClient(httpClient).get('https://external.example.com/data');

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://external.example.com/data',
      })
    );
  });

  it('throws AppError when response is not ok', async () => {
    const apiClient = new GoChampsApiClient(
      createHttpClient({
        ok: false,
        status: 404,
        data: {},
      })
    );

    await expect(apiClient.get('/missing')).rejects.toEqual(new AppError('HTTP error! status: 404', 404));
  });

  it('sends Bearer token from TokenProvider on get', async () => {
    const httpClient = createHttpClient({ ok: true, status: 200, data: { data: [] } });
    const client = new GoChampsApiClient(httpClient, { getToken: () => 'abc' });

    await client.get('/users/lucas');

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer abc' }),
      })
    );
  });

  it('sends Bearer null when no token', async () => {
    const httpClient = createHttpClient({ ok: true, status: 200, data: { data: [] } });
    const client = new GoChampsApiClient(httpClient, { getToken: () => null });

    await client.get('/recently-view');

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer null' }),
      })
    );
  });

  it('supports patch method', async () => {
    const httpClient = createHttpClient({ ok: true, status: 200, data: { data: {} } });
    const client = new GoChampsApiClient(httpClient, { getToken: () => 'abc' });

    await client.patch('/athlete-profiles/1', { athlete_profile: { name: 'L' } });

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        body: { athlete_profile: { name: 'L' } },
      })
    );
  });

  it('supports post put and delete methods', async () => {
    const httpClient = createHttpClient({ ok: true, status: 200, data: { data: {} } });
    const client = new GoChampsApiClient(httpClient, { getToken: () => 'abc' });

    await client.post('/athlete-profiles', { athlete_profile: { name: 'L' } });
    await client.put('/athlete-profiles/1', { athlete_profile: { name: 'L' } });
    await client.delete('/athlete-profiles/1');

    expect(httpClient.request).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'POST' }));
    expect(httpClient.request).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'PUT' }));
    expect(httpClient.request).toHaveBeenNthCalledWith(3, expect.objectContaining({ method: 'DELETE' }));
  });

  it('prefers API error detail when present', async () => {
    const apiClient = new GoChampsApiClient(
      createHttpClient({
        ok: false,
        status: 401,
        data: { errors: { detail: 'Unauthorized' } },
      })
    );

    await expect(apiClient.get('/users/ana')).rejects.toEqual(new AppError('Unauthorized', 401));
  });

  it('keeps changeset field errors on the AppError', async () => {
    const apiClient = new GoChampsApiClient(
      createHttpClient({
        ok: false,
        status: 422,
        data: { errors: { tax_id: ['is invalid'], detail: 'ignored', other: 'not a list' } },
      })
    );

    const error = await apiClient.put('/account-identity', {}).catch((caught: AppError) => caught);
    expect(error).toEqual(new AppError('ignored', 422));
    expect((error as AppError).fields).toEqual({ tax_id: ['is invalid'] });
  });

  it('leaves fields empty when the API sends none', async () => {
    const apiClient = new GoChampsApiClient(createHttpClient({ ok: false, status: 500, data: null }));
    const error = await apiClient.get('/x').catch((caught: AppError) => caught);
    expect((error as AppError).fields).toBeUndefined();
  });

  it('sends a body on delete', async () => {
    const httpClient = createHttpClient({ ok: true, status: 204, data: null });
    const client = new GoChampsApiClient(httpClient, { getToken: () => 'abc' });

    await expect(client.delete('/accounts', { password: 'secret' })).resolves.toBeNull();

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/accounts',
        method: 'DELETE',
        body: { password: 'secret' },
      })
    );
  });

  it('keeps the API error code and body on the AppError', async () => {
    const body = { error: 'account_owns_organizations', organizations: [{ id: 'o1', name: 'Org', slug: 'org' }] };
    const apiClient = new GoChampsApiClient(createHttpClient({ ok: false, status: 409, data: body }));

    const error = (await apiClient.delete('/accounts', {}).catch((caught: AppError) => caught)) as AppError;
    expect(error.status).toBe(409);
    expect(error.code).toBe('account_owns_organizations');
    expect(error.data).toEqual(body);
  });

  it('leaves the code empty when the error is not a string', async () => {
    const apiClient = new GoChampsApiClient(createHttpClient({ ok: false, status: 401, data: { error: { nested: true } } }));
    const error = (await apiClient.get('/x').catch((caught: AppError) => caught)) as AppError;
    expect(error.code).toBeUndefined();
  });
});
