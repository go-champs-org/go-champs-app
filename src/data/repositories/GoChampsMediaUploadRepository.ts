import { AppError } from '../../core/errors/AppError';
import { FileTransport, LocalFile } from '../../core/http/FileTransport';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import { MediaUploadRepository, UploadFileType } from '../../domain/repositories/MediaUploadRepository';

type ApiPresignedUrlResponse = {
  data: { filename: string; url: string; public_url: string };
};

/** Limits enforced by POST /v1/upload/presigned-url. */
export const MAX_UPLOAD_BYTES = 5_000_000;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const UPLOAD_FAILED = 'Não foi possível enviar a foto. Tente novamente.';

export class GoChampsMediaUploadRepository implements MediaUploadRepository {
  constructor(
    private readonly apiClient: GoChampsApiClient,
    private readonly transport: FileTransport
  ) {}

  async upload(file: LocalFile, fileType: UploadFileType): Promise<string> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
      throw new AppError('Use uma foto JPG ou PNG.');
    }

    let loaded;
    try {
      loaded = await this.transport.read(file.uri);
    } catch {
      throw new AppError(UPLOAD_FAILED);
    }
    if (loaded.size > MAX_UPLOAD_BYTES) {
      throw new AppError('A foto deve ter no máximo 5 MB.');
    }

    let presigned: ApiPresignedUrlResponse;
    try {
      presigned = await this.apiClient.post<ApiPresignedUrlResponse>('/upload/presigned-url', {
        filename: file.fileName,
        content_type: file.mimeType,
        size: loaded.size,
        file_type: fileType,
      });
    } catch (error) {
      throw new AppError(UPLOAD_FAILED, error instanceof AppError ? error.status : undefined);
    }

    const result = await this.transport.put(presigned.data.url, loaded, file.mimeType).catch(() => null);
    if (!result?.ok) throw new AppError(UPLOAD_FAILED, result?.status);

    return presigned.data.public_url;
  }
}
