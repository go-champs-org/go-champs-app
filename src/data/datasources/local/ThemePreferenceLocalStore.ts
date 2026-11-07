import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'go_champs.theme.preference';

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const webStorage = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
};

/** Keeps the appearance chosen in the menu: follow the system, light or dark. */
export class ThemePreferenceLocalStore {
  async load(): Promise<ThemePreference> {
    const raw =
      Platform.OS === 'web'
        ? (webStorage()?.getItem(THEME_PREFERENCE_KEY) ?? null)
        : await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  }

  async save(preference: ThemePreference): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage()?.setItem(THEME_PREFERENCE_KEY, preference);
      return;
    }
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  }
}
