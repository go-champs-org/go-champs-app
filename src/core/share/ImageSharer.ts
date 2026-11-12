/** What the device can do with a rendered image: share it, save it, copy it. */
export type SaveImageResult = 'saved' | 'denied';
export type ShareImageResult = 'shared' | 'cancelled';

export interface ImageSharer {
  /** Saving, sharing and copying need the native app (not the web build). */
  readonly available: boolean;
  /** Reports the OS outcome, rather than treating dismissal as success. */
  share(fileUri: string, dialogTitle: string): Promise<ShareImageResult>;
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
