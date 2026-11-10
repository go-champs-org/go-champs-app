import { act, renderHook } from '@testing-library/react-native';
import { container } from '../../di/container';
import { DeleteAccountError } from '../../domain/repositories/AccountRepository';
import { deferred } from '../../test/deferred';
import { useDeleteAccountViewModel } from '../DeleteAccountViewModel';

jest.mock('../../di/container', () => ({
  container: {
    deleteAccount: { execute: jest.fn() },
  },
}));

const execute = jest.mocked(container.deleteAccount.execute);

const setup = () => {
  const signOut = jest.fn().mockResolvedValue(undefined);
  const onDeleted = jest.fn();
  const hook = renderHook(() => useDeleteAccountViewModel({ signOut, onDeleted }));
  return { ...hook, signOut, onDeleted };
};

const confirmWith = async (result: ReturnType<typeof setup>['result'], password = 'secret') => {
  act(() => result.current.open());
  act(() => result.current.setPassword(password));
  let outcome: boolean | undefined;
  await act(async () => {
    outcome = await result.current.confirm();
  });
  return outcome;
};

describe('useDeleteAccountViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts idle with the confirmation hidden', () => {
    const { result } = setup();
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(result.current.visible).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.organizations).toEqual([]);
    expect(result.current.canConfirm).toBe(false);
  });

  it('opens the confirmation with an empty password and closes it on cancel', () => {
    const { result } = setup();
    act(() => result.current.open());
    expect(result.current.state).toEqual({ status: 'confirming' });
    expect(result.current.visible).toBe(true);
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.setPassword('secret'));
    expect(result.current.canConfirm).toBe(true);

    act(() => result.current.cancel());
    expect(result.current.visible).toBe(false);
    expect(result.current.password).toBe('');
  });

  it('does not call the API without a password', async () => {
    const { result } = setup();
    act(() => result.current.open());
    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.confirm();
    });
    expect(outcome).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it('deletes, signs out and goes home', async () => {
    execute.mockResolvedValue(undefined);
    const { result, signOut, onDeleted } = setup();

    await expect(confirmWith(result)).resolves.toBe(true);

    expect(execute).toHaveBeenCalledWith('secret');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(onDeleted.mock.invocationCallOrder[0]);
    expect(result.current.visible).toBe(false);
    expect(result.current.password).toBe('');
  });

  it('shows deleting while the request runs and ignores cancel and a second confirm', async () => {
    const request = deferred<void>();
    execute.mockReturnValue(request.promise);
    const { result } = setup();
    act(() => result.current.open());
    act(() => result.current.setPassword('secret'));

    let pending: Promise<boolean> | undefined;
    act(() => {
      pending = result.current.confirm();
    });
    expect(result.current.state).toEqual({ status: 'deleting' });
    expect(result.current.deleting).toBe(true);
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.cancel());
    expect(result.current.deleting).toBe(true);
    await act(async () => {
      await expect(result.current.confirm()).resolves.toBe(false);
    });
    expect(execute).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve();
      await pending;
    });
    expect(result.current.deleting).toBe(false);
  });

  it('keeps the session on a wrong password', async () => {
    execute.mockRejectedValue(new DeleteAccountError('invalid_password', 'Senha incorreta.', 401));
    const { result, signOut, onDeleted } = setup();

    await expect(confirmWith(result, 'wrong')).resolves.toBe(false);

    expect(signOut).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(true);
    expect(result.current.error).toBe('Senha incorreta.');
    expect(result.current.sessionExpired).toBe(false);
    expect(result.current.password).toBe('');
  });

  it('lists sole-owned organizations and keeps the session', async () => {
    const organizations = [{ id: 'o1', name: 'Federação Paulista', slug: 'fpb' }];
    execute.mockRejectedValue(
      new DeleteAccountError('owns_organizations', 'Você é o único dono destas organizações: Federação Paulista.', 409, organizations)
    );
    const { result, signOut } = setup();

    await confirmWith(result);

    expect(signOut).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ status: 'error', reason: 'owns_organizations' });
    expect(result.current.organizations).toEqual(organizations);
    expect(result.current.error).toContain('Federação Paulista');
  });

  it('keeps the session on a server or network failure', async () => {
    execute.mockRejectedValue(
      new DeleteAccountError('failed', 'Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.')
    );
    const { result, signOut, onDeleted } = setup();

    await confirmWith(result);

    expect(signOut).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.');
  });

  it('uses the generic message for an untyped failure', async () => {
    execute.mockRejectedValue(new Error('boom'));
    const { result, signOut } = setup();

    await confirmWith(result);

    expect(signOut).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ status: 'error', reason: 'failed' });
    expect(result.current.error).toBe('Não foi possível excluir sua conta. Verifique sua conexão e tente novamente.');
  });

  it('clears the session when it expired and hides the confirmation', async () => {
    execute.mockRejectedValue(
      new DeleteAccountError('session_expired', 'Sessão expirada. Entre novamente para excluir sua conta.', 401)
    );
    const { result, signOut, onDeleted } = setup();

    await confirmWith(result);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.visible).toBe(false);
    expect(result.current.error).toBe('Sessão expirada. Entre novamente para excluir sua conta.');
  });

  it('starts over when the confirmation is opened again after an error', async () => {
    execute.mockRejectedValue(new DeleteAccountError('invalid_password', 'Senha incorreta.', 401));
    const { result } = setup();
    await confirmWith(result, 'wrong');

    act(() => result.current.open());
    expect(result.current.state).toEqual({ status: 'confirming' });
    expect(result.current.error).toBeNull();
  });
});
