import { act, renderHook } from '@testing-library/react-native';
import { container } from '../../di/container';
import { ShareUnavailableError } from '../../core/share/ImageSharer';
import { ProfileShareCard } from '../../domain/usecases/shared/profileShare';
import { deferred } from '../../test/deferred';
import {
  SHARE_DIALOG_TITLE,
  SHARE_MESSAGES,
  ShareAction,
  StickerCapture,
  useProfileShareViewModel,
} from '../ProfileShareViewModel';

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

const opened = (value: ProfileShareCard | null = card) => {
  const hook = renderHook(({ current }: { current: ProfileShareCard | null }) => useProfileShareViewModel(current), {
    initialProps: { current: value },
  });
  act(() => hook.result.current.open());
  return hook;
};

const run = async (result: ReturnType<typeof opened>['result'], action: ShareAction, using = capture()) => {
  await act(async () => {
    await result.current.run(action, using);
  });
  return using;
};

describe('useProfileShareViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharer.share.mockResolvedValue(undefined);
    sharer.copy.mockResolvedValue(undefined);
    sharer.saveToPhotos.mockResolvedValue('saved');
  });
  afterEach(() => jest.useRealTimers());

  it('opens on the first format and closes', () => {
    const { result } = opened();
    expect(result.current.canShare).toBe(true);
    expect(result.current.visible).toBe(true);
    expect(result.current.formats).toHaveLength(4);
    expect(result.current.format.id).toBe('bottom-dark');
    expect(result.current.actionsAvailable).toBe(true);
    act(() => result.current.close());
    expect(result.current.visible).toBe(false);
  });

  it('does not open without a card', () => {
    const { result } = opened(null);
    expect(result.current.canShare).toBe(false);
    expect(result.current.visible).toBe(false);
  });

  it('hides the sheet when the card goes away', () => {
    const { result, rerender } = opened();
    rerender({ current: null });
    expect(result.current.visible).toBe(false);
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
    expect(sharer.share).toHaveBeenCalledWith('file:///tmp/sticker.png', SHARE_DIALOG_TITLE);
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
  });

  it('says when the device cannot share', async () => {
    sharer.share.mockRejectedValue(new ShareUnavailableError());
    const { result } = opened();
    await run(result, 'share');
    expect(result.current.error).toBe(SHARE_MESSAGES.unavailable);
  });

  it('runs one action at a time and clears the error on a new pick', async () => {
    const pending = deferred<void>();
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
      pending.resolve();
      await first;
    });
    expect(result.current.busy).toBeNull();

    sharer.saveToPhotos.mockResolvedValue('denied');
    await run(result, 'save');
    expect(result.current.error).toBe(SHARE_MESSAGES.denied);
    act(() => result.current.select('center-dark'));
    expect(result.current.error).toBeNull();
  });
});
