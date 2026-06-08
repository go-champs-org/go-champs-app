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
});
