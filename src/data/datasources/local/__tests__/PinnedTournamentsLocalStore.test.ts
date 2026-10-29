import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PinnedTournamentsLocalStore } from '../PinnedTournamentsLocalStore';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('PinnedTournamentsLocalStore', () => {
  const store = new PinnedTournamentsLocalStore();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  it('returns empty list when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await expect(store.loadIds()).resolves.toEqual([]);
  });

  it('round-trips pinned ids on native path', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(['a', 'b']));
    await store.saveIds(['a', 'b']);
    await expect(store.loadIds()).resolves.toEqual(['a', 'b']);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'go_champs.tournaments.pinned',
      JSON.stringify(['a', 'b'])
    );
  });

  it('ignores invalid payload', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('{not-json');
    await expect(store.loadIds()).resolves.toEqual([]);
  });

  it('ignores non-array json', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify({ id: 'x' }));
    await expect(store.loadIds()).resolves.toEqual([]);
  });

  it('filters non-string ids', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(['ok', 1, null, '']));
    await expect(store.loadIds()).resolves.toEqual(['ok']);
  });

  it('uses localStorage on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const memory = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });

    await store.saveIds(['web-1']);
    await expect(store.loadIds()).resolves.toEqual(['web-1']);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
