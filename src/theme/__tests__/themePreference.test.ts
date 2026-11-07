import React from 'react';
import * as ReactNative from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

const mockLoad = jest.fn();
const mockSave = jest.fn();
jest.mock('../../data/datasources/local/ThemePreferenceLocalStore', () => ({
  ThemePreferenceLocalStore: jest.fn().mockImplementation(() => ({ load: mockLoad, save: mockSave })),
}));

type Modules = {
  preference: typeof import('../themePreference');
  theme: typeof import('../theme');
};

// Each test starts from fresh theme modules, as on a new app launch, sharing
// one React and one react-native with the testing library.
const loadModules = (os: 'ios' | 'web' = 'ios'): Modules => {
  jest.resetModules();
  jest.doMock('react', () => React);
  jest.doMock('react-native', () => ReactNative);
  Object.defineProperty(ReactNative.Platform, 'OS', { configurable: true, value: os });
  jest.spyOn(ReactNative.Appearance, 'getColorScheme').mockReturnValue('light');
  jest.spyOn(ReactNative.Appearance, 'setColorScheme').mockImplementation(() => undefined);
  return {
    preference: jest.requireActual<Modules['preference']>('../themePreference'),
    theme: jest.requireActual<Modules['theme']>('../theme'),
  };
};

afterEach(() => jest.restoreAllMocks());

beforeEach(() => {
  mockLoad.mockReset().mockResolvedValue('system');
  mockSave.mockReset().mockResolvedValue(undefined);
});

describe('themePreference', () => {
  it('follows the system until something is picked', () => {
    const { preference, theme } = loadModules();
    expect(renderHook(() => preference.useThemePreference()).result.current).toBe('system');
    expect(renderHook(() => theme.useTheme()).result.current).toBe(theme.lightTheme);
  });

  it('switches the theme, overrides the native appearance and stores the choice', () => {
    const { preference, theme } = loadModules();
    const picked = renderHook(() => preference.useThemePreference());
    const active = renderHook(() => theme.useTheme());

    act(() => preference.setThemePreference('dark'));
    expect(picked.result.current).toBe('dark');
    expect(active.result.current).toBe(theme.darkTheme);
    expect(ReactNative.Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
    expect(mockSave).toHaveBeenLastCalledWith('dark');

    act(() => preference.setThemePreference('system'));
    expect(active.result.current).toBe(theme.lightTheme);
    expect(ReactNative.Appearance.setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });

  it('keeps the app light on a dark system', () => {
    const { preference, theme } = loadModules();
    (ReactNative.Appearance.getColorScheme as jest.Mock).mockReturnValue('dark');
    const active = renderHook(() => theme.useTheme());
    expect(active.result.current).toBe(theme.darkTheme);

    act(() => preference.setThemePreference('light'));
    expect(active.result.current).toBe(theme.lightTheme);
  });

  it('does nothing when the same appearance is picked again', () => {
    const { preference } = loadModules();
    preference.setThemePreference('system');
    expect(ReactNative.Appearance.setColorScheme).not.toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('system');
  });

  it('restores the stored appearance on launch', async () => {
    mockLoad.mockResolvedValue('dark');
    const { preference, theme } = loadModules();
    const active = renderHook(() => theme.useTheme());

    await act(() => preference.loadThemePreference());
    expect(preference.getThemePreference()).toBe('dark');
    expect(active.result.current).toBe(theme.darkTheme);
    expect(ReactNative.Appearance.setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('keeps a choice made before the stored one is read', async () => {
    let resolve: (value: string) => void = () => undefined;
    mockLoad.mockReturnValue(new Promise((done) => (resolve = done)));
    const { preference } = loadModules();

    const loading = preference.loadThemePreference();
    preference.setThemePreference('light');
    resolve('dark');
    await loading;
    expect(preference.getThemePreference()).toBe('light');
  });

  it('follows the system when the stored appearance cannot be read', async () => {
    mockLoad.mockRejectedValue(new Error('locked'));
    const { preference } = loadModules();
    await preference.loadThemePreference();
    expect(preference.getThemePreference()).toBe('system');
  });

  it('ignores a failed save', async () => {
    mockSave.mockRejectedValue(new Error('full'));
    const { preference } = loadModules();
    expect(() => preference.setThemePreference('dark')).not.toThrow();
    await Promise.resolve();
    expect(preference.getThemePreference()).toBe('dark');
  });

  it('leaves the native appearance alone on the web', () => {
    const { preference } = loadModules('web');
    preference.setThemePreference('dark');
    expect(ReactNative.Appearance.setColorScheme).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribing', () => {
    const { preference } = loadModules();
    const listener = jest.fn();
    const unsubscribe = preference.subscribeToThemePreference(listener);
    preference.setThemePreference('dark');
    unsubscribe();
    preference.setThemePreference('light');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
