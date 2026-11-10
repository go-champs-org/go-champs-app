import { useCallback, useState } from 'react';
import { container } from '../di/container';
import { ShareUnavailableError } from '../core/share/ImageSharer';
import { ShareFormat, shareFormatById } from '../domain/usecases/shared/shareFormats';
import { useFlashNotice } from './useFlashNotice';

export type ShareAction = 'copy' | 'save' | 'share';

/**
 * Renders the selected sticker to an image, as a temporary file or as base64:
 * a transparent PNG, or a JPEG when it has a photo background.
 */
export type StickerCapture = {
  toFile: () => Promise<string>;
  toBase64: () => Promise<string>;
};

export const SHARE_MESSAGES = {
  copied: 'Imagem copiada. Cole no seu story ou numa conversa.',
  saved: 'Imagem salva nas suas fotos.',
  denied: 'Permita que o Go Champs adicione fotos nos Ajustes do iPhone para salvar a imagem.',
  unavailable: 'O compartilhamento não está disponível neste aparelho.',
  failed: {
    copy: 'Não foi possível copiar a imagem. Tente novamente.',
    save: 'Não foi possível salvar a imagem. Tente novamente.',
    share: 'Não foi possível compartilhar a imagem. Tente novamente.',
  } satisfies Record<ShareAction, string>,
};

export type ShareStickerOptions<Format extends ShareFormat> = {
  formats: Format[];
  // The native share sheet's title: 'Compartilhar perfil'
  dialogTitle: string;
};

/**
 * A story sticker to share (Compartilhar perfil, Compartilhar jogo): open it
 * with what goes on the sticker, pick one of its formats and, optionally, a
 * photo to put behind it, then copy, save or share the image.
 */
export const useShareStickerViewModel = <Payload, Format extends ShareFormat>({
  formats,
  dialogTitle,
}: ShareStickerOptions<Format>) => {
  // What the open sheet shows; null while it is closed.
  const [payload, setPayload] = useState<Payload | null>(null);
  const [formatId, setFormatId] = useState(formats[0].id);
  const [busy, setBusy] = useState<ShareAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The athlete's own photo behind the sticker; without one it stays transparent.
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);
  const { notice, showNotice, clearNotice } = useFlashNotice();
  const sharer = container.imageSharer;

  const open = useCallback(
    (next: Payload) => {
      setError(null);
      clearNotice();
      setPayload(next);
    },
    [clearNotice]
  );

  const close = useCallback(() => setPayload(null), []);

  const select = useCallback(
    (id: string) => {
      setFormatId(shareFormatById(formats, id).id);
      setError(null);
    },
    [formats]
  );

  const selectBackground = useCallback((uri: string | null) => {
    setBackgroundUri(uri);
    setError(null);
  }, []);

  const run = async (action: ShareAction, capture: StickerCapture) => {
    if (busy) return;
    setBusy(action);
    setError(null);
    clearNotice();
    try {
      if (action === 'copy') {
        await sharer.copy(await capture.toBase64());
        showNotice(SHARE_MESSAGES.copied);
      } else if (action === 'save') {
        const result = await sharer.saveToPhotos(await capture.toFile());
        if (result === 'saved') showNotice(SHARE_MESSAGES.saved);
        else setError(SHARE_MESSAGES.denied);
      } else {
        // The share sheet is its own feedback: nothing to say after it closes.
        await sharer.share(await capture.toFile(), dialogTitle);
      }
    } catch (failure) {
      setError(failure instanceof ShareUnavailableError ? SHARE_MESSAGES.unavailable : SHARE_MESSAGES.failed[action]);
    } finally {
      setBusy(null);
    }
  };

  return {
    payload,
    visible: payload !== null,
    open,
    close,
    formats,
    format: shareFormatById(formats, formatId),
    select,
    backgroundUri,
    /** Pass null to go back to the transparent sticker. */
    selectBackground,
    /** Copy, save and share need the native app. */
    actionsAvailable: sharer.available,
    busy,
    error,
    notice,
    run,
  };
};

export type ShareStickerModel<Payload, Format extends ShareFormat = ShareFormat> = ReturnType<
  typeof useShareStickerViewModel<Payload, Format>
>;
