import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ThemePreferenceLocalStore } from '../ThemePreferenceLocalStore';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('ThemePreferenceLocalStore', () => {
  const store = new ThemePreferenceLocalStore();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  it('follows the system when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await expect(store.load()).resolves.toBe('system');
  });

  it('round-trips the preference on native', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('dark');
    await store.save('dark');
    await expect(store.load()).resolves.toBe('dark');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('go_champs.theme.preference', 'dark');
  });

  it('ignores an unknown value', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('sepia');
    await expect(store.load()).resolves.toBe('system');
  });

  it('uses localStorage on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const memory = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
      },
    });

    await expect(store.load()).resolves.toBe('system');
    await store.save('light');
    await expect(store.load()).resolves.toBe('light');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('follows the system on web without storage', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });
    await store.save('dark');
    await expect(store.load()).resolves.toBe('system');
  });
});
