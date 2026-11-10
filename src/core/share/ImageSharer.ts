/** What the device can do with a rendered image: share it, save it, copy it. */
export type SaveImageResult = 'saved' | 'denied';

export interface ImageSharer {
  /** Saving, sharing and copying need the native app (not the web build). */
  readonly available: boolean;
  /** Opens the native share sheet. Resolves when it closes. */
  share(fileUri: string, dialogTitle: string): Promise<void>;
  /** Adds the image to Photos, asking for add-only access first. */
  saveToPhotos(fileUri: string): Promise<SaveImageResult>;
  copy(base64Image: string): Promise<void>;
}

export class ShareUnavailableError extends Error {
  constructor() {
    super('Sharing is not available on this device.');
    this.name = 'ShareUnavailableError';
  }
}
