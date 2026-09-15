import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthTokenStore, StoredSession } from './AuthTokenStore';

const TOKEN_KEY = 'go_champs.auth.token';
const USERNAME_KEY = 'go_champs.auth.username';
const EMAIL_KEY = 'go_champs.auth.email';

const webStorage = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
};

const setItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    webStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
};

const deleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export class SecureAuthTokenStore implements AuthTokenStore {
  async load(): Promise<StoredSession | null> {
    const [token, username, email] = await Promise.all([
      getItem(TOKEN_KEY),
      getItem(USERNAME_KEY),
      getItem(EMAIL_KEY),
    ]);

    if (!token || !username || !email) {
      return null;
    }

    return { token, username, email };
  }

  async save(session: StoredSession): Promise<void> {
    await Promise.all([
      setItem(TOKEN_KEY, session.token),
      setItem(USERNAME_KEY, session.username),
      setItem(EMAIL_KEY, session.email),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([deleteItem(TOKEN_KEY), deleteItem(USERNAME_KEY), deleteItem(EMAIL_KEY)]);
  }
}
