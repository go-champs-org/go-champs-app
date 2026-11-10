import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { AthleteProfile } from '../../domain/repositories/AthleteProfileRepository';
import { NOTICE_DURATION_MS } from '../useFlashNotice';
import { useProfileViewModel } from '../ProfileViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAthleteProfileByUsername: { execute: jest.fn() },
    saveAthleteProfile: { execute: jest.fn() },
  },
}));

const athlete: AthleteProfile = {
  id: 'a1',
  username: 'ana',
  name: 'Ana',
  photo_url: 'https://cdn/old.png',
  facebook: null,
  instagram: '@ana',
  twitter: null,
};

const photo = { uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' };

const loadWith = async ({ athleteProfile = athlete }: { athleteProfile?: AthleteProfile | null } = {}) => {
  jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athleteProfile);
  const hook = renderHook(() => useProfileViewModel('ana'));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  await waitFor(() => expect(container.getAthleteProfileByUsername.execute).toHaveBeenCalledWith('ana'));
  await waitFor(() => expect(hook.result.current.athlete.data).toEqual(athleteProfile));
  return hook;
};

describe('useProfileViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('loading', () => {
    it('opens straight on the form for the edit screen', async () => {
      jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
      const { result } = renderHook(() => useProfileViewModel('ana', { editOnLoad: true }));
      await waitFor(() => expect(result.current.athlete.editing).toBe(true));
      expect(result.current.athlete.values.name).toBe('Ana');
      expect(result.current.athlete.values.instagram).toBe('@ana');
    });

    it('opens an empty form to create the athlete profile', async () => {
      jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);
      const { result } = renderHook(() => useProfileViewModel('ana', { editOnLoad: true }));
      await waitFor(() => expect(result.current.athlete.editing).toBe(true));
      expect(result.current.athlete.data).toBeNull();
      expect(result.current.athlete.values.name).toBe('');
    });

    it('does not fetch without username', async () => {
      const { result } = renderHook(() => useProfileViewModel(undefined));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(container.getAthleteProfileByUsername.execute).not.toHaveBeenCalled();
      expect(result.current.athlete.data).toBeNull();
    });

    it('loads the athlete profile', async () => {
      const { result } = await loadWith();
      expect(result.current.athlete.data).toEqual(athlete);
      expect(result.current.athlete.photoUri).toBe('https://cdn/old.png');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('reports an empty athlete profile', async () => {
      const { result } = await loadWith({ athleteProfile: null });
      expect(result.current.athlete.data).toBeNull();
      expect(result.current.athlete.photoUri).toBeNull();
    });

    it('surfaces load errors and retries', async () => {
      jest
        .mocked(container.getAthleteProfileByUsername.execute)
        .mockRejectedValueOnce(new AppError('Sessão expirada.', 401));
      const { result } = renderHook(() => useProfileViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Sessão expirada.'));

      jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
      act(() => result.current.refresh());
      await waitFor(() => expect(result.current.athlete.data).toEqual(athlete));
      expect(result.current.error).toBeNull();
    });

    it('uses a fallback message for unknown load failures', async () => {
      jest.mocked(container.getAthleteProfileByUsername.execute).mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useProfileViewModel('ana'));
      await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar seu perfil de atleta.'));
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

  describe('save notice', () => {
    const saveAthlete = async () => {
      jest.mocked(container.saveAthleteProfile.execute).mockResolvedValue(athlete);
      const hook = await loadWith();
      act(() => hook.result.current.athlete.startEdit());
      await act(async () => {
        await hook.result.current.athlete.save();
      });
      expect(hook.result.current.notice).toBe('Perfil de atleta atualizado.');
      return hook;
    };

    afterEach(() => jest.useRealTimers());

    it('clears when the screen asks (leaving the tab)', async () => {
      const { result } = await saveAthlete();
      act(() => result.current.clearNotice());
      expect(result.current.notice).toBeNull();
    });

    it('disappears after the notice duration', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      const { result } = await saveAthlete();
      act(() => jest.advanceTimersByTime(NOTICE_DURATION_MS - 1));
      expect(result.current.notice).toBe('Perfil de atleta atualizado.');
      act(() => jest.advanceTimersByTime(1));
      expect(result.current.notice).toBeNull();
    });
  });
});
