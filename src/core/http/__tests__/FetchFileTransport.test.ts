import { FetchFileTransport } from '../FetchFileTransport';

describe('FetchFileTransport', () => {
  it('reads a local file as a blob', async () => {
    const blob = { size: 42 };
    global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(blob) });
    await expect(new FetchFileTransport().read('file:///p.jpg')).resolves.toEqual({ body: blob, size: 42 });
    expect(global.fetch).toHaveBeenCalledWith('file:///p.jpg');
  });

  it('PUTs the file to the presigned URL with its content type', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const body = { size: 42 } as Blob;
    await expect(new FetchFileTransport().put('https://r2/put', { body, size: 42 }, 'image/png')).resolves.toEqual({
      ok: true,
      status: 200,
    });
    expect(global.fetch).toHaveBeenCalledWith('https://r2/put', {
      method: 'PUT',
      headers: { 'content-type': 'image/png' },
      body,
    });
  });
});
