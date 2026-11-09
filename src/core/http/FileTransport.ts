export type LocalFile = {
  /** A file://, blob: or data: URI, as an image picker returns it. */
  uri: string;
  mimeType: string;
  fileName: string;
};

export type LoadedFile = {
  body: Blob;
  size: number;
};

/**
 * Reads a local file and sends it to a presigned storage URL. Kept apart from
 * HttpClient, which speaks JSON to the Go Champs API only.
 */
export interface FileTransport {
  read(uri: string): Promise<LoadedFile>;
  put(url: string, file: LoadedFile, contentType: string): Promise<{ ok: boolean; status: number }>;
}
