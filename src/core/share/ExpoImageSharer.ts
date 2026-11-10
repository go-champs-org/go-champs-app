import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { ImageSharer, SaveImageResult, ShareUnavailableError } from './ImageSharer';

export class ExpoImageSharer implements ImageSharer {
  readonly available = Platform.OS !== 'web';

  async share(fileUri: string, dialogTitle: string): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) throw new ShareUnavailableError();
    await Sharing.shareAsync(fileUri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
  }

  async saveToPhotos(fileUri: string): Promise<SaveImageResult> {
    // Add-only access is enough to save, and keeps the rest of Photos private.
    const permission = await requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) return 'denied';
    // From the file itself, so the PNG keeps its transparency.
    await Asset.create(fileUri);
    return 'saved';
  }

  async copy(base64Png: string): Promise<void> {
    await Clipboard.setImageAsync(base64Png);
  }
}
