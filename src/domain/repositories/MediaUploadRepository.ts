import { LocalFile } from '../../core/http/FileTransport';

export type UploadFileType = 'athlete-profiles-photos';

export interface MediaUploadRepository {
  /** Uploads the file and returns its public URL. */
  upload(file: LocalFile, fileType: UploadFileType): Promise<string>;
}
