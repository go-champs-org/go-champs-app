import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';
import { ThemePreference, ThemePreferenceLocalStore } from '../data/datasources/local/ThemePreferenceLocalStore';

export type { ThemePreference };

const store = new ThemePreferenceLocalStore();
const listeners = new Set<() => void>();
let preference: ThemePreference = 'system';
// Set once the visitor picks an appearance, so a slow stored read cannot undo it.
let chosen = false;

const notify = () => listeners.forEach((listener) => listener());

// Native views the app does not draw (keyboard, alerts, pickers) follow the
// override too. The web has no app-level override.
const applyToNative = (next: ThemePreference) => {
  if (Platform.OS === 'web') return;
  Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
};

const update = (next: ThemePreference) => {
  if (next === preference) return;
  preference = next;
  applyToNative(next);
  notify();
};

export const getThemePreference = (): ThemePreference => preference;

export const subscribeToThemePreference = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Reads the stored appearance; called once when the app starts. */
export async function loadThemePreference(): Promise<void> {
  const stored = await store.load().catch((): ThemePreference => 'system');
  if (!chosen) update(stored);
}

/** Picks the appearance from the menu and keeps it for the next launches. */
export function setThemePreference(next: ThemePreference): void {
  chosen = true;
  update(next);
  store.save(next).catch(() => undefined);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribeToThemePreference, getThemePreference, () => 'system');
}
