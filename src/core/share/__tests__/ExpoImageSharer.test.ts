import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import Share from 'react-native-share';
import { ExpoImageSharer } from '../ExpoImageSharer';
import { ShareUnavailableError } from '../ImageSharer';

jest.mock('expo-clipboard', () => ({ setImageAsync: jest.fn() }));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() },
}));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: jest.fn() } }));

const FILE = 'file:///tmp/sticker.png';

describe('ExpoImageSharer', () => {
  beforeEach(() => jest.resetAllMocks());

  it('is available in the native app', () => {
    expect(new ExpoImageSharer().available).toBe(true);
  });

  it('shares the PNG through the native share sheet', async () => {
    jest.mocked(Share.open).mockResolvedValue({ success: true, message: 'shared' });
    await expect(new ExpoImageSharer().share(FILE, 'Compartilhar perfil')).resolves.toBe('shared');
    expect(Share.open).toHaveBeenCalledWith({
      url: FILE, type: 'image/png', title: 'Compartilhar perfil', failOnCancel: false,
    });
  });

  it('shares a photo-background sticker as a JPEG', async () => {
    jest.mocked(Share.open).mockResolvedValue({ success: true, message: 'shared' });
    await new ExpoImageSharer().share('file:///tmp/sticker.jpg', 'Compartilhar perfil');
    expect(Share.open).toHaveBeenCalledWith({
      url: 'file:///tmp/sticker.jpg', type: 'image/jpeg', title: 'Compartilhar perfil', failOnCancel: false,
    });
  });

  it('fails clearly when the device cannot share', async () => {
    const sharer = new ExpoImageSharer();
    Object.defineProperty(sharer, 'available', { value: false });
    await expect(sharer.share(FILE, 'x')).rejects.toBeInstanceOf(ShareUnavailableError);
    expect(Share.open).not.toHaveBeenCalled();
  });

  it('distinguishes cancellation, including a dismissed native action', async () => {
    jest.mocked(Share.open).mockResolvedValueOnce({ success: false, dismissedAction: true, message: 'cancelled' })
      .mockResolvedValueOnce({ success: true, dismissedAction: true, message: 'cancelled' });
    await expect(new ExpoImageSharer().share(FILE, 'x')).resolves.toBe('cancelled');
    await expect(new ExpoImageSharer().share(FILE, 'x')).resolves.toBe('cancelled');
  });

  it('propagates real native errors without treating them as success', async () => {
    jest.mocked(Share.open).mockRejectedValue(new Error('unavailable'));
    await expect(new ExpoImageSharer().share(FILE, 'x')).rejects.toThrow('unavailable');
  });

  it('asks for add-only photo access, then saves the file itself', async () => {
    jest.mocked(requestPermissionsAsync).mockResolvedValue({ granted: true } as never);
    await expect(new ExpoImageSharer().saveToPhotos(FILE)).resolves.toBe('saved');
    expect(requestPermissionsAsync).toHaveBeenCalledWith(true, ['photo']);
    expect(Asset.create).toHaveBeenCalledWith(FILE);
  });

  it('does not save when photo access is denied', async () => {
    jest.mocked(requestPermissionsAsync).mockResolvedValue({ granted: false } as never);
    await expect(new ExpoImageSharer().saveToPhotos(FILE)).resolves.toBe('denied');
    expect(Asset.create).not.toHaveBeenCalled();
  });

  it('copies the PNG to the clipboard', async () => {
    await new ExpoImageSharer().copy('iVBORw0KGgo=');
    expect(Clipboard.setImageAsync).toHaveBeenCalledWith('iVBORw0KGgo=');
  });
});
