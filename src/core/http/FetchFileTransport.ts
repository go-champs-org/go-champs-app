import { FileTransport, LoadedFile } from './FileTransport';

export class FetchFileTransport implements FileTransport {
  async read(uri: string): Promise<LoadedFile> {
    const response = await fetch(uri);
    const body = await response.blob();
    return { body, size: body.size };
  }

  async put(url: string, file: LoadedFile, contentType: string) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: file.body,
    });
    return { ok: response.ok, status: response.status };
  }
}
