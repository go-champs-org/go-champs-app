import { FetchHttpClient } from '../FetchHttpClient';

describe('FetchHttpClient', () => {
  it('wraps fetch response data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: 'ok' }),
    });

    await expect(new FetchHttpClient().request({ endpoint: 'https://example.com' })).resolves.toEqual({
      ok: true,
      status: 200,
      data: { data: 'ok' },
    });
  });
});

