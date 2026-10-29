import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { deferred } from '../../test/deferred';
import { useGameDetailViewModel } from '../GameDetailViewModel';
import { useMyGamesViewModel } from '../MyGamesViewModel';
import { useProfileViewModel } from '../ProfileViewModel';

jest.mock('../../di/container', () => ({ container: {
  getGameOverview: { execute: jest.fn() },
  getAthleteSchedules: { execute: jest.fn() },
  getAccountProfile: { execute: jest.fn() },
  getAthleteProfileByUsername: { execute: jest.fn() },
} }));

const cases = [
  { name: 'game', useModel: (id: string) => useGameDetailViewModel(id),
    service: container.getGameOverview, value: { game: null, boxScore: [] } },
  { name: 'schedule', useModel: (id: string) => useMyGamesViewModel(Boolean(id)),
    service: container.getAthleteSchedules, value: [] },
  { name: 'profile', useModel: (id: string) => useProfileViewModel(id),
    service: container.getAccountProfile, value: { username: 'ana', email: 'ana@example.com' } },
];

describe.each(cases)('$name request lifecycle', ({ useModel, service, value }) => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(container.getAthleteProfileByUsername.execute).mockResolvedValue(null);
  });

  it.each(['resolve', 'reject'] as const)('ignores a stale request that will %s after a refresh', async (settle) => {
    const stale = deferred<unknown>();
    const execute = service.execute as jest.Mock;
    execute.mockReturnValueOnce(stale.promise).mockResolvedValue(value);
    const { result } = renderHook(() => useModel('ana'));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const settledState = result.current;
    await act(async () => {
      if (settle === 'resolve') stale.resolve(value);
      else stale.reject(new Error('stale request'));
    });
    expect(result.current).toEqual(settledState);
    expect(result.current.error).toBeNull();
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
