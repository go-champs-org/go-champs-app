import * as Clipboard from 'expo-clipboard';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { ExpoImageSharer } from '../ExpoImageSharer';
import { ShareUnavailableError } from '../ImageSharer';

jest.mock('expo-clipboard', () => ({ setImageAsync: jest.fn() }));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() },
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const FILE = 'file:///tmp/sticker.png';

describe('ExpoImageSharer', () => {
  beforeEach(() => jest.resetAllMocks());

  it('is available in the native app', () => {
    expect(new ExpoImageSharer().available).toBe(true);
  });

  it('shares the PNG through the native share sheet', async () => {
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    await new ExpoImageSharer().share(FILE, 'Compartilhar perfil');
    expect(Sharing.shareAsync).toHaveBeenCalledWith(FILE, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Compartilhar perfil',
    });
  });

  it('fails clearly when the device cannot share', async () => {
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
    await expect(new ExpoImageSharer().share(FILE, 'x')).rejects.toBeInstanceOf(ShareUnavailableError);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
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
