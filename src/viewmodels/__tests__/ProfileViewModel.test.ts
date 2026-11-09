import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { AccountIdentity } from '../../domain/repositories/AccountIdentityRepository';
import { AthleteProfile } from '../../domain/repositories/AthleteProfileRepository';
import { useProfileViewModel } from '../ProfileViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAccountProfile: { execute: jest.fn() },
    getAthleteProfileByUsername: { execute: jest.fn() },
    getAccountIdentity: { execute: jest.fn() },
    saveAccountIdentity: { execute: jest.fn() },
    saveAthleteProfile: { execute: jest.fn() },
  },
}));

const account = {
  email: 'ana@example.com',
  username: 'ana',
  organizations: [],
};

const athlete: AthleteProfile = {
  id: 'a1',
  username: 'ana',
  name: 'Ana',
  photo_url: 'https://cdn/old.png',
  facebook: null,
  instagram: '@ana',
  twitter: null,
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

const photo = { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' };

const loadWith = async (
  { athleteProfile = athlete, accountIdentity = identity }: {
    athleteProfile?: AthleteProfile | null;
    accountIdentity?: AccountIdentity | null;
  } = {}
) => {
  jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
  jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athleteProfile);
  jest.mocked(container.getAccountIdentity.execute).mockResolvedValue(accountIdentity);
  const hook = renderHook(() => useProfileViewModel('ana'));
  await waitFor(() => expect(hook.result.current.account).toEqual(account));
  return hook;
};

describe('useProfileViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('loading', () => {
    it('does not fetch without username', async () => {
      const { result } = renderHook(() => useProfileViewModel(undefined));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(container.getAccountProfile.execute).not.toHaveBeenCalled();
      expect(result.current.athlete.data).toBeNull();
      expect(result.current.identity.data).toBeNull();
    });

    it('loads account, athlete profile and identity together', async () => {
      const { result } = await loadWith();
      expect(result.current.athlete.data).toEqual(athlete);
      expect(result.current.identity.data).toEqual(identity);
      expect(result.current.identity.hasData).toBe(true);
      expect(result.current.athlete.photoUri).toBe('https://cdn/old.png');
      expect(result.current.loading).toBe(false);
    });

    it('reports empty athlete profile and identity', async () => {
      const { result } = await loadWith({ athleteProfile: null, accountIdentity: null });
      expect(result.current.athlete.data).toBeNull();
      expect(result.current.identity.hasData).toBe(false);
    });

    it('surfaces load errors and retries', async () => {
      jest.mocked(container.getAccountProfile.execute).mockRejectedValueOnce(new AppError('Sessão expirada.', 401));
      jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
      jest.mocked(container.getAccountIdentity.execute).mockResolvedValue(identity);
      const { result } = renderHook(() => useProfileViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Sessão expirada.'));

      jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
      act(() => result.current.refresh());
      await waitFor(() => expect(result.current.account).toEqual(account));
      expect(result.current.error).toBeNull();
    });

    it('uses a fallback message for unknown load failures', async () => {
      jest.mocked(container.getAccountProfile.execute).mockRejectedValue(new Error('boom'));
      jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
      jest.mocked(container.getAccountIdentity.execute).mockResolvedValue(identity);
      const { result } = renderHook(() => useProfileViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar seu perfil.'));
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

  describe('athlete section', () => {
    it('toggles every field into edit mode with the stored values', async () => {
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      expect(result.current.athlete.editing).toBe(true);
      expect(result.current.athlete.values).toEqual({ name: 'Ana', facebook: '', instagram: '@ana', twitter: '' });
    });

    it('cancel restores the original values and photo', async () => {
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      act(() => result.current.athlete.setField('name', 'Outra'));
      act(() => result.current.athlete.selectPhoto(photo));
      expect(result.current.athlete.photoUri).toBe('file:///photo.jpg');
      act(() => result.current.athlete.cancelEdit());
      expect(result.current.athlete.editing).toBe(false);
      expect(result.current.athlete.values.name).toBe('Ana');
      expect(result.current.athlete.photoUri).toBe('https://cdn/old.png');
      expect(container.saveAthleteProfile.execute).not.toHaveBeenCalled();
    });

    it('saves values and the new photo in one call', async () => {
      const saved = { ...athlete, name: 'Ana Silva', photo_url: 'https://cdn/new.jpg' };
      jest.mocked(container.saveAthleteProfile.execute).mockResolvedValue(saved);
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      act(() => result.current.athlete.setField('name', 'Ana Silva'));
      act(() => result.current.athlete.selectPhoto(photo));

      await act(async () => {
        await expect(result.current.athlete.save()).resolves.toBe(true);
      });

      expect(container.saveAthleteProfile.execute).toHaveBeenCalledWith({
        username: 'ana',
        original: athlete,
        values: { name: 'Ana Silva', facebook: '', instagram: '@ana', twitter: '' },
        photo: { kind: 'replace', file: photo },
      });
      expect(result.current.athlete.data).toEqual(saved);
      expect(result.current.athlete.editing).toBe(false);
      expect(result.current.athlete.photoUri).toBe('https://cdn/new.jpg');
      expect(result.current.notice).toBe('Perfil de atleta atualizado.');
    });

    it('sends a photo removal', async () => {
      jest.mocked(container.saveAthleteProfile.execute).mockResolvedValue({ ...athlete, photo_url: null });
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      act(() => result.current.athlete.removePhoto());
      expect(result.current.athlete.photoUri).toBeNull();
      await act(async () => {
        await result.current.athlete.save();
      });
      expect(container.saveAthleteProfile.execute).toHaveBeenCalledWith(
        expect.objectContaining({ photo: { kind: 'remove' } })
      );
    });

    it('creates the profile when there is none', async () => {
      jest.mocked(container.saveAthleteProfile.execute).mockResolvedValue(athlete);
      const { result } = await loadWith({ athleteProfile: null });
      act(() => result.current.athlete.startEdit());
      expect(result.current.athlete.values.name).toBe('');
      act(() => result.current.athlete.setField('name', 'Ana'));
      await act(async () => {
        await result.current.athlete.save();
      });
      expect(container.saveAthleteProfile.execute).toHaveBeenCalledWith(
        expect.objectContaining({ original: null, photo: { kind: 'keep' } })
      );
      expect(result.current.athlete.data).toEqual(athlete);
      expect(result.current.notice).toBe('Perfil de atleta criado.');
    });

    it('requires an athlete name', async () => {
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      act(() => result.current.athlete.setField('name', '  '));
      await act(async () => {
        await expect(result.current.athlete.save()).resolves.toBe(false);
      });
      expect(result.current.athlete.fieldErrors).toEqual({ name: 'Informe o nome de atleta.' });
      expect(container.saveAthleteProfile.execute).not.toHaveBeenCalled();
    });

    it('keeps edit mode and maps API field errors on failure', async () => {
      jest
        .mocked(container.saveAthleteProfile.execute)
        .mockRejectedValue(new AppError('Confira os campos destacados.', 422, { instagram: ['bad'] }));
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      act(() => result.current.athlete.selectPhoto(photo));
      await act(async () => {
        await expect(result.current.athlete.save()).resolves.toBe(false);
      });
      expect(result.current.athlete.editing).toBe(true);
      expect(result.current.athlete.saving).toBe(false);
      expect(result.current.athlete.photoUri).toBe('file:///photo.jpg');
      expect(result.current.athlete.fieldErrors).toEqual({ instagram: 'Use @usuario ou o link do Instagram.' });
    });

    it('uses a fallback message for unknown save failures', async () => {
      jest.mocked(container.saveAthleteProfile.execute).mockRejectedValue(new Error('offline'));
      const { result } = await loadWith();
      act(() => result.current.athlete.startEdit());
      await act(async () => {
        await result.current.athlete.save();
      });
      expect(result.current.athlete.error).toBe('Não foi possível salvar o perfil de atleta.');
    });

    it('skips saving without username', async () => {
      const { result } = renderHook(() => useProfileViewModel(undefined));
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await expect(result.current.athlete.save()).resolves.toBe(false);
      });
      expect(container.saveAthleteProfile.execute).not.toHaveBeenCalled();
    });
  });
});
