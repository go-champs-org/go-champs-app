import { WebAuthPurpose } from './WebAuthPurpose';

export type WebAuthFlowCallbacks = {
  onComplete?: () => void;
  onCancel?: () => void;
};

/**
 * Port for secure web auth flows (signup / recovery / credentials).
 * Swap the WebView implementation for a native one without touching callers.
 */
export interface WebAuthFlowPort {
  purpose: WebAuthPurpose;
  startUrl: string;
  openExternal(): Promise<void>;
}
