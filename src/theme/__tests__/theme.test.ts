import { act, renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { darkTheme, getTheme, lightTheme, makeStyles, useTheme } from '../theme';

const mockScheme = (scheme: 'light' | 'dark' | null) =>
  jest.spyOn(ReactNative.Appearance, 'getColorScheme').mockReturnValue(scheme);

afterEach(() => jest.restoreAllMocks());

describe('theme', () => {
  it('gives both palettes the same tokens', () => {
    expect(Object.keys(darkTheme.colors).sort()).toEqual(Object.keys(lightTheme.colors).sort());
  });

  it('keeps the brand accents that sit on always-dark surfaces', () => {
    for (const token of ['highlightsStart', 'highlightsEnd', 'flame', 'bannerStart', 'bannerEnd', 'onDark'] as const) {
      expect(darkTheme.colors[token]).toBe(lightTheme.colors[token]);
    }
  });

  it('falls back to light unless the system asks for dark', () => {
    expect(getTheme('dark')).toBe(darkTheme);
    expect(getTheme('light')).toBe(lightTheme);
    expect(getTheme(null)).toBe(lightTheme);
    expect(getTheme('unspecified')).toBe(lightTheme);
  });

  it('follows the system appearance', () => {
    mockScheme('dark');
    expect(renderHook(() => useTheme()).result.current).toBe(darkTheme);
    mockScheme('light');
    expect(renderHook(() => useTheme()).result.current).toBe(lightTheme);
  });

  it('switches when the system appearance changes', () => {
    let notify: () => void = () => undefined;
    const remove = jest.fn();
    jest.spyOn(ReactNative.Appearance, 'addChangeListener').mockImplementation((listener) => {
      notify = () => listener({ colorScheme: ReactNative.Appearance.getColorScheme() });
      return { remove };
    });
    mockScheme('light');
    const { result, unmount } = renderHook(() => useTheme());
    expect(result.current).toBe(lightTheme);

    mockScheme('dark');
    act(() => notify());
    expect(result.current).toBe(darkTheme);

    unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('builds one style sheet per theme and reuses it', () => {
    const factory = jest.fn((theme: typeof lightTheme) => ({ box: { backgroundColor: theme.colors.background } }));
    const useStyles = makeStyles(factory);

    mockScheme('dark');
    const dark = renderHook(() => useStyles());
    dark.rerender({});
    expect(dark.result.current.box.backgroundColor).toBe(darkTheme.colors.background);

    mockScheme('light');
    const light = renderHook(() => useStyles());
    expect(light.result.current.box.backgroundColor).toBe(lightTheme.colors.background);

    mockScheme('dark');
    expect(renderHook(() => useStyles()).result.current).toBe(dark.result.current);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
