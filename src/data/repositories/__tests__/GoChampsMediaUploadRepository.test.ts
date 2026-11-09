import { AppError } from '../../../core/errors/AppError';
import { FileTransport } from '../../../core/http/FileTransport';
import { HttpClient } from '../../../core/http/HttpClient';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsMediaUploadRepository, MAX_UPLOAD_BYTES } from '../GoChampsMediaUploadRepository';

const request = jest.fn();
const httpClient = { request } as unknown as HttpClient;
const apiClient = new GoChampsApiClient(httpClient, { getToken: () => 'tok' });
const body = { size: 1234 } as Blob;
const transport = {
  read: jest.fn(),
  put: jest.fn(),
} as jest.Mocked<FileTransport>;
const repository = new GoChampsMediaUploadRepository(apiClient, transport);
const file = { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' };
const presigned = {
  ok: true,
  status: 200,
  data: { data: { filename: 'photo.jpg', url: 'https://r2/put?sig=1', public_url: 'https://cdn/photo.jpg' } },
};

const failed = new AppError('Não foi possível enviar a foto. Tente novamente.');

describe('GoChampsMediaUploadRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transport.read.mockResolvedValue({ body, size: 1234 });
    transport.put.mockResolvedValue({ ok: true, status: 200 });
    request.mockResolvedValue(presigned);
  });

  it('asks for a presigned URL, uploads to it and returns the public URL', async () => {
    await expect(repository.upload(file, 'athlete-profiles-photos')).resolves.toBe('https://cdn/photo.jpg');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/upload/presigned-url',
        method: 'POST',
        body: { filename: 'photo.jpg', content_type: 'image/jpeg', size: 1234, file_type: 'athlete-profiles-photos' },
      })
    );
    expect(transport.read).toHaveBeenCalledWith('file:///photo.jpg');
    expect(transport.put).toHaveBeenCalledWith('https://r2/put?sig=1', { body, size: 1234 }, 'image/jpeg');
  });

  it('rejects types the API does not accept', async () => {
    await expect(repository.upload({ ...file, mimeType: 'image/heic' }, 'athlete-profiles-photos')).rejects.toEqual(
      new AppError('Use uma foto JPG ou PNG.')
    );
    expect(transport.read).not.toHaveBeenCalled();
  });

  it('rejects photos over 5 MB before asking for a URL', async () => {
    transport.read.mockResolvedValue({ body, size: MAX_UPLOAD_BYTES + 1 });
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(
      new AppError('A foto deve ter no máximo 5 MB.')
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('fails when the file cannot be read', async () => {
    transport.read.mockRejectedValue(new Error('read'));
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(failed);
  });

  it('fails when the presigned URL request fails', async () => {
    request.mockResolvedValue({ ok: false, status: 400, data: { error: 'Invalid file type' } });
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(
      new AppError(failed.message, 400)
    );
    request.mockRejectedValue(new TypeError('offline'));
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(failed);
  });

  it('fails when storage refuses the upload', async () => {
    transport.put.mockResolvedValue({ ok: false, status: 403 });
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(
      new AppError(failed.message, 403)
    );
    transport.put.mockRejectedValue(new TypeError('offline'));
    await expect(repository.upload(file, 'athlete-profiles-photos')).rejects.toEqual(failed);
  });
});
