import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { AccountIdentity } from '../../domain/repositories/AccountIdentityRepository';
import { NOTICE_DURATION_MS } from '../useFlashNotice';
import { useAccountViewModel } from '../AccountViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAccountProfile: { execute: jest.fn() },
    getAccountIdentity: { execute: jest.fn() },
    saveAccountIdentity: { execute: jest.fn() },
  },
}));

const account = {
  email: 'ana@example.com',
  username: 'ana',
  organizations: [],
};

const identity: AccountIdentity = {
  id: 'i1',
  full_legal_name: 'Ana Silva',
  tax_id_type: 'CPF',
  tax_id_last4: '4725',
  government_id_type: null,
  government_id_last4: null,
  date_of_birth: '1997-05-21',
};

const loadWith = async ({ accountIdentity = identity }: { accountIdentity?: AccountIdentity | null } = {}) => {
  jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
  jest.mocked(container.getAccountIdentity.execute).mockResolvedValue(accountIdentity);
  const hook = renderHook(() => useAccountViewModel('ana'));
  await waitFor(() => expect(hook.result.current.account).toEqual(account));
  return hook;
};

describe('useAccountViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('loading', () => {
    it('does not fetch without username', async () => {
      const { result } = renderHook(() => useAccountViewModel(undefined));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(container.getAccountProfile.execute).not.toHaveBeenCalled();
      expect(container.getAccountIdentity.execute).not.toHaveBeenCalled();
      expect(result.current.account).toBeNull();
      expect(result.current.identity.data).toBeNull();
    });

    it('loads account and identity together', async () => {
      const { result } = await loadWith();
      expect(container.getAccountProfile.execute).toHaveBeenCalledWith('ana');
      expect(result.current.identity.data).toEqual(identity);
      expect(result.current.identity.hasData).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('reports empty identity', async () => {
      const { result } = await loadWith({ accountIdentity: null });
      expect(result.current.identity.data).toBeNull();
      expect(result.current.identity.hasData).toBe(false);
    });

    it('surfaces load errors and retries', async () => {
      jest.mocked(container.getAccountProfile.execute).mockRejectedValueOnce(new AppError('Sessão expirada.', 401));
      jest.mocked(container.getAccountIdentity.execute).mockResolvedValue(identity);
      const { result } = renderHook(() => useAccountViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Sessão expirada.'));

      jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
      act(() => result.current.refresh());
      await waitFor(() => expect(result.current.account).toEqual(account));
      expect(result.current.error).toBeNull();
    });

    it('uses a fallback message for unknown load failures', async () => {
      jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
      jest.mocked(container.getAccountIdentity.execute).mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useAccountViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar sua conta.'));
    });
  });

  describe('identity section', () => {
    it('toggles every field into edit mode with the stored values', async () => {
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      expect(result.current.identity.editing).toBe(true);
      expect(result.current.identity.values).toEqual({
        fullLegalName: 'Ana Silva',
        taxId: '',
        governmentId: '',
        dateOfBirth: '21/05/1997',
      });
    });

    it('cancel restores the original values and leaves edit mode', async () => {
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      act(() => result.current.identity.setField('fullLegalName', 'Outro Nome'));
      act(() => result.current.identity.cancelEdit());
      expect(result.current.identity.editing).toBe(false);
      expect(result.current.identity.values.fullLegalName).toBe('Ana Silva');
      expect(container.saveAccountIdentity.execute).not.toHaveBeenCalled();
    });

    it('saves the whole section in one request', async () => {
      const saved = { ...identity, full_legal_name: 'Ana Souza' };
      jest.mocked(container.saveAccountIdentity.execute).mockResolvedValue(saved);
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      act(() => result.current.identity.setField('fullLegalName', 'Ana Souza'));

      await act(async () => {
        await expect(result.current.identity.save()).resolves.toBe(true);
      });

      expect(container.saveAccountIdentity.execute).toHaveBeenCalledTimes(1);
      expect(container.saveAccountIdentity.execute).toHaveBeenCalledWith(
        { fullLegalName: 'Ana Souza', taxId: '', governmentId: '', dateOfBirth: '21/05/1997' },
        identity
      );
      expect(result.current.identity.data).toEqual(saved);
      expect(result.current.identity.editing).toBe(false);
      expect(result.current.notice).toBe('Dados de identidade salvos.');
    });

    it('shows the saving state while the request runs', async () => {
      let resolveSave: (value: AccountIdentity) => void = () => undefined;
      jest.mocked(container.saveAccountIdentity.execute).mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        })
      );
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      let pending: Promise<boolean> = Promise.resolve(false);
      act(() => {
        pending = result.current.identity.save();
      });
      expect(result.current.identity.saving).toBe(true);
      await act(async () => {
        resolveSave(identity);
        await pending;
      });
      expect(result.current.identity.saving).toBe(false);
    });

    it('blocks invalid values before sending', async () => {
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      act(() => result.current.identity.setField('taxId', '11111111111'));
      await act(async () => {
        await expect(result.current.identity.save()).resolves.toBe(false);
      });
      expect(container.saveAccountIdentity.execute).not.toHaveBeenCalled();
      expect(result.current.identity.fieldErrors).toEqual({ taxId: 'CPF inválido.' });
      expect(result.current.identity.error).toBe('Confira os campos destacados.');

      act(() => result.current.identity.setField('taxId', '529'));
      expect(result.current.identity.fieldErrors).toEqual({});
    });

    it('keeps edit mode and maps API field errors on failure', async () => {
      jest
        .mocked(container.saveAccountIdentity.execute)
        .mockRejectedValue(new AppError('Confira os campos destacados.', 422, { tax_id: ['is invalid'] }));
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      await act(async () => {
        await expect(result.current.identity.save()).resolves.toBe(false);
      });
      expect(result.current.identity.editing).toBe(true);
      expect(result.current.identity.saving).toBe(false);
      expect(result.current.identity.error).toBe('Confira os campos destacados.');
      expect(result.current.identity.fieldErrors).toEqual({ taxId: 'Valor inválido.' });
    });

    it('uses a fallback message for unknown save failures', async () => {
      jest.mocked(container.saveAccountIdentity.execute).mockRejectedValue(new Error('offline'));
      const { result } = await loadWith();
      act(() => result.current.identity.startEdit());
      await act(async () => {
        await result.current.identity.save();
      });
      expect(result.current.identity.error).toBe('Não foi possível salvar seus dados de identidade.');
      expect(result.current.identity.fieldErrors).toEqual({});
    });
  });

  describe('save notice', () => {
    const saveIdentity = async () => {
      jest.mocked(container.saveAccountIdentity.execute).mockResolvedValue(identity);
      const hook = await loadWith();
      act(() => hook.result.current.identity.startEdit());
      await act(async () => {
        await hook.result.current.identity.save();
      });
      expect(hook.result.current.notice).toBe('Dados de identidade salvos.');
      return hook;
    };

    afterEach(() => jest.useRealTimers());

    it('clears when the screen asks', async () => {
      const { result } = await saveIdentity();
      act(() => result.current.clearNotice());
      expect(result.current.notice).toBeNull();
    });

    it('clears when editing starts again', async () => {
      const { result } = await saveIdentity();
      act(() => result.current.identity.startEdit());
      expect(result.current.notice).toBeNull();
    });

    it('disappears after the notice duration', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      const { result } = await saveIdentity();
      act(() => jest.advanceTimersByTime(NOTICE_DURATION_MS - 1));
      expect(result.current.notice).toBe('Dados de identidade salvos.');
      act(() => jest.advanceTimersByTime(1));
      expect(result.current.notice).toBeNull();
    });
  });
});
