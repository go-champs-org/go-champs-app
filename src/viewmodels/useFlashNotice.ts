import { useCallback, useEffect, useState } from 'react';

export const NOTICE_DURATION_MS = 4000;

/**
 * A success message is a moment, not state: it fades on its own, and screens
 * clear it on blur (tab screens stay mounted between visits).
 */
export const useFlashNotice = () => {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return { notice, showNotice: setNotice, clearNotice };
};
