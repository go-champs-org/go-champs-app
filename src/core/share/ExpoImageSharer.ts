import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { ImageSharer, SaveImageResult, ShareImageResult, ShareUnavailableError } from './ImageSharer';

export class ExpoImageSharer implements ImageSharer {
  readonly available = Platform.OS !== 'web';

  async share(fileUri: string, dialogTitle: string): Promise<ShareImageResult> {
    if (!this.available) throw new ShareUnavailableError();
    // A sticker with a photo background is a JPEG; a transparent one is a PNG.
    const jpeg = /\.jpe?g$/i.test(fileUri);
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Also allows dev/Expo Go to start without this native module.
    const { default: Share }: typeof import('react-native-share') = require('react-native-share');
    const result = await Share.open({
      url: fileUri,
      type: jpeg ? 'image/jpeg' : 'image/png',
      title: dialogTitle,
      failOnCancel: false,
    });
    return result.success && !result.dismissedAction ? 'shared' : 'cancelled';
  }

  async saveToPhotos(fileUri: string): Promise<SaveImageResult> {
    // Add-only access is enough to save, and keeps the rest of Photos private.
    const permission = await requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) return 'denied';
    // From the file itself, so a PNG keeps its transparency.
    await Asset.create(fileUri);
    return 'saved';
  }

  async copy(base64Image: string): Promise<void> {
    await Clipboard.setImageAsync(base64Image);
  }
}
