import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SecureAuthTokenStore } from '../SecureAuthTokenStore';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('SecureAuthTokenStore', () => {
  const store = new SecureAuthTokenStore();
  const session = { token: 'tok', username: 'ana', email: 'ana@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  it('round-trips session on native path', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key.endsWith('token')) return session.token;
      if (key.endsWith('username')) return session.username;
      if (key.endsWith('email')) return session.email;
      return null;
    });

    await store.save(session);
    await expect(store.load()).resolves.toEqual(session);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
  });

  it('returns null when empty', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await expect(store.load()).resolves.toBeNull();
  });

  it('clears stored keys', async () => {
    await store.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
  });

  it('uses localStorage on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const memory = new Map<string, string>();
    const localStorageMock = {
      setItem: jest.fn((key: string, value: string) => memory.set(key, value)),
      getItem: jest.fn((key: string) => memory.get(key) ?? null),
      removeItem: jest.fn((key: string) => memory.delete(key)),
    };
    Object.defineProperty(global, 'localStorage', { configurable: true, value: localStorageMock });

    await store.save(session);
    await expect(store.load()).resolves.toEqual(session);
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
