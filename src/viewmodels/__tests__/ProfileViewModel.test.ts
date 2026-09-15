import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { useProfileViewModel } from '../ProfileViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getAccountProfile: { execute: jest.fn() },
    getAthleteProfileByUsername: { execute: jest.fn() },
    createAthleteProfile: { execute: jest.fn() },
    updateAthleteProfile: { execute: jest.fn() },
  },
}));

const account = {
  email: 'ana@example.com',
  username: 'ana',
  organizations: [{ id: '1', name: 'Org', slug: 'org', logo_url: null }],
};

const athlete = {
  id: 'a1',
  username: 'ana',
  name: 'Ana',
  photo_url: null,
  facebook: null,
  instagram: null,
  twitter: null,
};

describe('useProfileViewModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not fetch without username', async () => {
    const { result } = renderHook(() => useProfileViewModel(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(container.getAccountProfile.execute).not.toHaveBeenCalled();
  });

  it('loads account and athlete profiles', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.account).toEqual(account));
    expect(result.current.athlete).toEqual(athlete);
    expect(result.current.athleteMissing).toBe(false);
  });

  it('marks athlete as missing on null', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athleteMissing).toBe(true));
  });

  it('creates athlete profile and refreshes local state', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);
    jest.mocked(container.createAthleteProfile.execute).mockResolvedValue(athlete);

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athleteMissing).toBe(true));

    await act(async () => {
      await expect(result.current.createAthlete({ name: ' Ana ' })).resolves.toBe(true);
    });

    expect(container.createAthleteProfile.execute).toHaveBeenCalledWith({ name: 'Ana' });
    expect(result.current.athlete).toEqual(athlete);
    expect(result.current.athleteMissing).toBe(false);
  });

  it('validates empty athlete name', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athleteMissing).toBe(true));

    await act(async () => {
      await expect(result.current.createAthlete({ name: '   ' })).resolves.toBe(false);
    });
    expect(result.current.error).toBe('Informe o nome do perfil de atleta.');
  });

  it('surfaces create athlete errors', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);
    jest.mocked(container.createAthleteProfile.execute).mockRejectedValue(new AppError('falhou criar', 500));

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athleteMissing).toBe(true));

    await act(async () => {
      await expect(result.current.createAthlete({ name: 'Ana' })).resolves.toBe(false);
    });
    expect(result.current.error).toBe('falhou criar');
  });

  it('updates athlete profile', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
    jest.mocked(container.updateAthleteProfile.execute).mockResolvedValue({ ...athlete, name: 'Ana 2' });

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athlete).toEqual(athlete));

    await act(async () => {
      await expect(result.current.updateAthlete({ name: ' Ana 2 ' })).resolves.toBe(true);
    });
    expect(container.updateAthleteProfile.execute).toHaveBeenCalledWith('ana', { name: 'Ana 2' });
    expect(result.current.athlete?.name).toBe('Ana 2');
  });

  it('surfaces update athlete errors', async () => {
    jest.mocked(container.getAccountProfile.execute).mockResolvedValue(account);
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(athlete);
    jest.mocked(container.updateAthleteProfile.execute).mockRejectedValue(new AppError('falhou update', 500));

    const { result } = renderHook(() => useProfileViewModel('ana'));
    await waitFor(() => expect(result.current.athlete).toEqual(athlete));

    await act(async () => {
      await expect(result.current.updateAthlete({ name: 'Ana' })).resolves.toBe(false);
    });
    expect(result.current.error).toBe('falhou update');
  });

  it('skips update without username', async () => {
    const { result } = renderHook(() => useProfileViewModel(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await expect(result.current.updateAthlete({ name: 'Ana' })).resolves.toBe(false);
    });
    expect(container.updateAthleteProfile.execute).not.toHaveBeenCalled();
  });
});
