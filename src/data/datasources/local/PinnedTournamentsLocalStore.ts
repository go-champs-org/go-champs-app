import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PINNED_KEY = 'go_champs.tournaments.pinned';

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

export class PinnedTournamentsLocalStore {
  async loadIds(): Promise<string[]> {
    const raw = await getItem(PINNED_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
    } catch {
      return [];
    }
  }

  async saveIds(ids: string[]): Promise<void> {
    await setItem(PINNED_KEY, JSON.stringify(ids));
  }
}
