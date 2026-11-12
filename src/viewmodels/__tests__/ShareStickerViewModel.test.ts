import { act, renderHook } from '@testing-library/react-native';
import { container } from '../../di/container';
import { ShareUnavailableError } from '../../core/share/ImageSharer';
import { PROFILE_SHARE_FORMATS, ProfileShareCard, ProfileShareFormat } from '../../domain/usecases/shared/profileShare';
import { deferred } from '../../test/deferred';
import { SHARE_MESSAGES, ShareAction, StickerCapture, useShareStickerViewModel } from '../ShareStickerViewModel';
import { analytics } from '../../core/analytics/analytics';
import { GAME_SHARE_FORMATS, GameShareFormat } from '../../domain/usecases/shared/gameShare';

jest.mock('../../core/analytics/analytics', () => ({ analytics: { track: jest.fn() } }));

jest.mock('../../di/container', () => ({
  container: {
    imageSharer: {
      available: true,
      share: jest.fn(),
      saveToPhotos: jest.fn(),
      copy: jest.fn(),
    },
  },
}));

const sharer = jest.mocked(container.imageSharer);

const card: ProfileShareCard = {
  name: 'Ana Silva',
  sport: 'Basquete 5x5',
  tournaments: '3',
  games: '24',
  stats: [],
};

const capture = (): StickerCapture & { toFile: jest.Mock; toBase64: jest.Mock } => ({
  toFile: jest.fn().mockResolvedValue('file:///tmp/sticker.png'),
  toBase64: jest.fn().mockResolvedValue('iVBORw0KGgo='),
});

const DIALOG_TITLE = 'Compartilhar perfil';

const closed = () =>
  renderHook(() =>
    useShareStickerViewModel<ProfileShareCard, ProfileShareFormat>({
      formats: PROFILE_SHARE_FORMATS,
      dialogTitle: DIALOG_TITLE,
      sticker: 'profile',
    })
  );

const opened = () => {
  const hook = closed();
  act(() => hook.result.current.open(card));
  return hook;
};

const run = async (result: ReturnType<typeof opened>['result'], action: ShareAction, using = capture()) => {
  await act(async () => {
    await result.current.run(action, using);
  });
  return using;
};

describe('useShareStickerViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharer.share.mockResolvedValue('shared');
    sharer.copy.mockResolvedValue(undefined);
    sharer.saveToPhotos.mockResolvedValue('saved');
  });
  afterEach(() => jest.useRealTimers());

  it('opens with what goes on the sticker, on the first format, and closes', () => {
    const { result } = opened();
    expect(result.current.visible).toBe(true);
    expect(result.current.payload).toBe(card);
    expect(result.current.formats).toHaveLength(4);
    expect(result.current.format.id).toBe('bottom-dark');
    expect(result.current.actionsAvailable).toBe(true);
    act(() => result.current.close());
    expect(result.current.visible).toBe(false);
    expect(result.current.payload).toBeNull();
  });

  it('starts closed', () => {
    const { result } = closed();
    expect(result.current.visible).toBe(false);
    expect(result.current.payload).toBeNull();
  });

  it('switches formats and ignores unknown ids', () => {
    const { result } = opened();
    act(() => result.current.select('center-light'));
    expect(result.current.format).toMatchObject({ id: 'center-light', layout: 'center', logo: 'light' });
    act(() => result.current.select('nope'));
    expect(result.current.format.id).toBe('bottom-dark');
  });

  it('puts a photo behind the sticker and takes it away', async () => {
    sharer.saveToPhotos.mockResolvedValue('denied');
    const { result } = opened();
    expect(result.current.backgroundUri).toBeNull();
    await run(result, 'save');
    expect(result.current.error).toBe(SHARE_MESSAGES.denied);

    act(() => result.current.selectBackground('file:///photos/game.jpg'));
    expect(result.current.backgroundUri).toBe('file:///photos/game.jpg');
    expect(result.current.error).toBeNull();
    act(() => result.current.selectBackground(null));
    expect(result.current.backgroundUri).toBeNull();
  });

  it('shares the captured file through the share sheet without a notice', async () => {
    const { result } = opened();
    const used = await run(result, 'share');
    expect(used.toFile).toHaveBeenCalled();
    expect(sharer.share).toHaveBeenCalledWith('file:///tmp/sticker.png', DIALOG_TITLE);
    expect(result.current.notice).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.busy).toBeNull();
  });

  it('saves the captured file to Photos', async () => {
    const { result } = opened();
    await run(result, 'save');
    expect(sharer.saveToPhotos).toHaveBeenCalledWith('file:///tmp/sticker.png');
    expect(result.current.notice).toBe(SHARE_MESSAGES.saved);
  });

  it('explains how to allow Photos when access is denied', async () => {
    sharer.saveToPhotos.mockResolvedValue('denied');
    const { result } = opened();
    await run(result, 'save');
    expect(result.current.error).toBe(SHARE_MESSAGES.denied);
    expect(result.current.notice).toBeNull();
  });

  it('copies the PNG as base64 and the notice fades', async () => {
    jest.useFakeTimers();
    const { result } = opened();
    const used = await run(result, 'copy');
    expect(used.toBase64).toHaveBeenCalled();
    expect(sharer.copy).toHaveBeenCalledWith('iVBORw0KGgo=');
    expect(result.current.notice).toBe(SHARE_MESSAGES.copied);
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current.notice).toBeNull();
  });

  it.each<[ShareAction, string]>([
    ['copy', SHARE_MESSAGES.failed.copy],
    ['save', SHARE_MESSAGES.failed.save],
    ['share', SHARE_MESSAGES.failed.share],
  ])('reports a failed %s', async (action, message) => {
    const { result } = opened();
    const failing = capture();
    failing.toFile.mockRejectedValue(new Error('capture'));
    failing.toBase64.mockRejectedValue(new Error('capture'));
    await run(result, action, failing);
    expect(result.current.error).toBe(message);
    expect(result.current.busy).toBeNull();
    expect(jest.mocked(analytics.track).mock.calls.filter(([event]) => event === 'Sticker Shared')).toHaveLength(0);
  });

  it('says when the device cannot share', async () => {
    sharer.share.mockRejectedValue(new ShareUnavailableError());
    const { result } = opened();
    await run(result, 'share');
    expect(result.current.error).toBe(SHARE_MESSAGES.unavailable);
  });

  it('runs one action at a time and clears the error on a new pick', async () => {
    const pending = deferred<'shared' | 'cancelled'>();
    sharer.share.mockReturnValue(pending.promise);
    const { result } = opened();
    let first: Promise<void> | undefined;
    await act(async () => {
      first = result.current.run('share', capture());
    });
    expect(result.current.busy).toBe('share');

    await run(result, 'copy');
    expect(sharer.copy).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve('shared');
      await first;
    });
    expect(result.current.busy).toBeNull();

    sharer.saveToPhotos.mockResolvedValue('denied');
    await run(result, 'save');
    expect(result.current.error).toBe(SHARE_MESSAGES.denied);
    act(() => result.current.select('center-dark'));
    expect(result.current.error).toBeNull();
  });

  it('tracks opening without including the profile payload', () => {
    opened();
    expect(analytics.track).toHaveBeenCalledWith('Share Sheet Opened', { sticker: 'profile' });
  });

  it.each<ShareAction>(['copy', 'save', 'share'])('tracks %s only after success, with format and photo flag', async (action) => {
    const { result } = opened();
    act(() => { result.current.select('center-light'); result.current.selectBackground('file:///private-photo.jpg'); });
    await run(result, action);
    expect(analytics.track).toHaveBeenCalledWith('Sticker Shared', {
      sticker: 'profile', action, format_id: 'center-light', has_photo: true,
    });
    expect(JSON.stringify(jest.mocked(analytics.track).mock.calls)).not.toContain('private-photo');
    expect(JSON.stringify(jest.mocked(analytics.track).mock.calls)).not.toContain('Ana Silva');
  });

  it('does not count cancellation or denied photo access as a share', async () => {
    sharer.share.mockResolvedValue('cancelled');
    sharer.saveToPhotos.mockResolvedValue('denied');
    const { result } = opened();
    await run(result, 'share');
    await run(result, 'save');
    expect(jest.mocked(analytics.track).mock.calls.filter(([event]) => event === 'Sticker Shared')).toHaveLength(0);
  });

  it('uses the same success contract for profile and game stickers', async () => {
    const profile = opened();
    const game = renderHook(() => useShareStickerViewModel<{ id: string }, GameShareFormat>({
      formats: GAME_SHARE_FORMATS, dialogTitle: 'Compartilhar jogo', sticker: 'game',
    }));
    act(() => game.result.current.open({ id: 'g1' }));
    await run(profile.result, 'copy');
    await act(async () => { await game.result.current.run('share', capture()); });
    expect(jest.mocked(analytics.track).mock.calls.filter(([event]) => event === 'Sticker Shared').map(([, properties]) => properties))
      .toEqual([
        { sticker: 'profile', action: 'copy', format_id: 'bottom-dark', has_photo: false },
        { sticker: 'game', action: 'share', format_id: 'bottom-left-dark', has_photo: false },
      ]);
  });
});
