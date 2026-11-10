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

  it('serializes a POST request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ data: 'created' }),
    });

    await new FetchHttpClient().request({
      endpoint: 'https://example.com/session',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { username: 'lucas' },
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'lucas' }),
    });
  });

  it('returns null data for 204 No Content without parsing a body', async () => {
    const json = jest.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204, json });

    await expect(
      new FetchHttpClient().request({ endpoint: 'https://example.com/accounts', method: 'DELETE', body: { password: 'x' } })
    ).resolves.toEqual({ ok: true, status: 204, data: null });
    expect(json).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/accounts', {
      method: 'DELETE',
      headers: undefined,
      body: JSON.stringify({ password: 'x' }),
    });
  });
});
