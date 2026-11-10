import { useCallback, useState } from 'react';
import { container } from '../di/container';
import { ShareUnavailableError } from '../core/share/ImageSharer';
import {
  DEFAULT_SHARE_FORMAT_ID,
  ProfileShareCard,
  SHARE_FORMATS,
  shareFormatById,
} from '../domain/usecases/shared/profileShare';
import { useFlashNotice } from './useFlashNotice';

export type ShareAction = 'copy' | 'save' | 'share';

/** Renders the selected sticker to a PNG, as a temporary file or as base64. */
export type StickerCapture = {
  toFile: () => Promise<string>;
  toBase64: () => Promise<string>;
};

export const SHARE_DIALOG_TITLE = 'Compartilhar perfil';

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

/**
 * Perfil > Compartilhar perfil: pick one of the four sticker formats, then
 * copy, save or share it as a transparent PNG.
 */
export const useProfileShareViewModel = (card: ProfileShareCard | null) => {
  const [visible, setVisible] = useState(false);
  const [formatId, setFormatId] = useState(DEFAULT_SHARE_FORMAT_ID);
  const [busy, setBusy] = useState<ShareAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice, clearNotice } = useFlashNotice();
  const sharer = container.imageSharer;

  const open = useCallback(() => {
    if (!card) return;
    setError(null);
    clearNotice();
    setVisible(true);
  }, [card, clearNotice]);

  const close = useCallback(() => setVisible(false), []);

  const select = useCallback((id: string) => {
    setFormatId(shareFormatById(id).id);
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
        await sharer.share(await capture.toFile(), SHARE_DIALOG_TITLE);
      }
    } catch (failure) {
      setError(failure instanceof ShareUnavailableError ? SHARE_MESSAGES.unavailable : SHARE_MESSAGES.failed[action]);
    } finally {
      setBusy(null);
    }
  };

  return {
    /** Nothing to share before the first recorded game. */
    canShare: card !== null,
    visible: visible && card !== null,
    open,
    close,
    formats: SHARE_FORMATS,
    format: shareFormatById(formatId),
    select,
    /** Copy, save and share need the native app. */
    actionsAvailable: sharer.available,
    busy,
    error,
    notice,
    run,
  };
};
