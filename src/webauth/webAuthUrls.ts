import { WebAuthPurpose } from './WebAuthPurpose';

const WEB_ORIGIN = 'https://go-champs.com';

export const webAuthStartUrl: Record<WebAuthPurpose, string> = {
  signUp: `${WEB_ORIGIN}/SignUp`,
  accountRecovery: `${WEB_ORIGIN}/AccountRecovery`,
  accountCredentials: `${WEB_ORIGIN}/Account`,
};

/** Paths that indicate the web flow finished successfully. */
const SUCCESS_PATH_MARKERS = ['/signin', '/account', '/tournaments', '/'];

export const isWebAuthSuccessUrl = (url: string, purpose: WebAuthPurpose): boolean => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('go-champs.com')) return false;

    const path = parsed.pathname.toLowerCase();
    const startPath = new URL(webAuthStartUrl[purpose]).pathname.toLowerCase();

    if (path === startPath || path.startsWith(`${startPath}/`)) return false;

    if (purpose === 'signUp') {
      return path.includes('/signin') || path === '/' || path.startsWith('/account');
    }

    return SUCCESS_PATH_MARKERS.some((marker) => path === marker || path.startsWith(`${marker}/`));
  } catch {
    return false;
  }
};
