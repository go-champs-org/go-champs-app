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
});
