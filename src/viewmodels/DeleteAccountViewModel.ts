import { useState } from 'react';
import { container } from '../di/container';
import { DeleteAccountError, DeleteAccountFailure, SoleOwnedOrganization } from '../domain/repositories/AccountRepository';

const FALLBACK_MESSAGE = 'Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.';

export type DeleteAccountState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'deleting' }
  | { status: 'error'; reason: DeleteAccountFailure; message: string; organizations: SoleOwnedOrganization[] };

type Options = {
  /** Clears the stored session (`AuthSessionContext.signOut`). */
  signOut: () => Promise<void>;
  /** Runs after the account is gone and the session cleared: go back to Home. */
  onDeleted: () => void;
};

/** Menu > Minha conta > Excluir conta: password confirmation and the outcomes of GC-389. */
export const useDeleteAccountViewModel = ({ signOut, onDeleted }: Options) => {
  const [state, setState] = useState<DeleteAccountState>({ status: 'idle' });
  const [password, setPassword] = useState('');

  const open = () => {
    setPassword('');
    setState({ status: 'confirming' });
  };

  const cancel = () => {
    if (state.status === 'deleting') return;
    setPassword('');
    setState({ status: 'idle' });
  };

  const confirm = async () => {
    if (!password || state.status === 'deleting') return false;

    setState({ status: 'deleting' });
    try {
      await container.deleteAccount.execute(password);
    } catch (requestError) {
      const failure =
        requestError instanceof DeleteAccountError
          ? requestError
          : new DeleteAccountError('failed', FALLBACK_MESSAGE);
      // The token no longer works: drop it so the user signs in again.
      if (failure.reason === 'session_expired') await signOut();
      setPassword('');
      setState({
        status: 'error',
        reason: failure.reason,
        message: failure.message,
        organizations: failure.organizations,
      });
      return false;
    }

    setPassword('');
    setState({ status: 'idle' });
    await signOut();
    onDeleted();
    return true;
  };

  // The session ended during the attempt: the screen asks the user to sign in again.
  const sessionExpired = state.status === 'error' && state.reason === 'session_expired';

  return {
    state,
    /** The confirmation is on screen (also while deleting or showing an error). */
    visible: state.status !== 'idle' && !sessionExpired,
    deleting: state.status === 'deleting',
    error: state.status === 'error' ? state.message : null,
    organizations: state.status === 'error' ? state.organizations : [],
    sessionExpired,
    password,
    setPassword,
    canConfirm: password.length > 0 && state.status !== 'deleting',
    open,
    cancel,
    confirm,
  };
};
