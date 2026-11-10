import { useSyncExternalStore } from 'react';
import { Appearance, StyleSheet } from 'react-native';
import { getThemePreference, subscribeToThemePreference } from './themePreference';

export type ColorScheme = 'light' | 'dark';

const lightColors = {
  primary: '#10130d',
  onPrimary: '#ffffff',
  onPrimaryMuted: '#d1d4ca',
  // Text on surfaces that stay dark in both themes (highlights, banners).
  onDark: '#ffffff',
  chromeBorder: 'transparent',
  // The search field on the header.
  chromeField: '#262a21',
  background: '#fafaee',
  surface: '#ffffff',
  surfaceMuted: '#e8eadf',
  surfaceStrong: '#dce8c4',
  textPrimary: '#1c2016',
  textSecondary: '#6f982c',
  accent: '#92c43f',
  onAccent: '#10130d',
  accentSoft: '#e4edcf',
  card: '#ffffff',
  border: '#d5d8cc',
  shadow: '#000000',
  mutedText: '#62675a',
  inactive: '#9da294',
  danger: '#c62f2f',
  dangerSoft: '#f7dcd8',
  onDangerSoft: '#8a1f1f',
  success: '#4f771c',
  overlay: 'rgba(16, 19, 13, 0.58)',
  backdrop: 'rgba(0, 0, 0, 0.35)',
  // Over content that is reloading.
  veil: 'rgba(255, 255, 255, 0.6)',
  ink: '#131f00',
  olive: '#4f6628',
  onOlive: '#ffffff',
  oliveSoft: '#dde6c6',
  onOliveSoft: '#414a32',
  oliveWash: 'rgba(79, 102, 40, 0.12)',
  lime: '#8bb93b',
  subtleText: '#73776c',
  tint: '#f3f7e9',
  cardBorder: '#dde3c8',
  outline: '#c5c8b9',
  subtleBorder: '#e8e9dc',
  bannerStart: '#111111',
  bannerEnd: '#2e502c',
  divider: 'rgba(19, 31, 0, 0.14)',
  highlightsStart: '#12140e',
  highlightsEnd: '#2f4419',
  flame: '#f5a623',
};

export type ThemeColors = { [K in keyof typeof lightColors]: string };

/**
 * Mirrors the dark palette of go-champs-web (packages/ui/src/theme.css):
 * page #1D1D1B, surfaces #2C2C2C, borders #4A4A4A, brand text #A6CD63 and a
 * hairline on the chrome (header, tab bar), which shares the page color.
 */
const darkColors: ThemeColors = {
  primary: '#1d1d1b',
  onPrimary: '#ffffff',
  onPrimaryMuted: '#9a9d93',
  onDark: '#ffffff',
  chromeBorder: '#4a4a4a',
  chromeField: '#2c2c2c',
  background: '#1d1d1b',
  surface: '#2c2c2c',
  surfaceMuted: '#3a3b36',
  surfaceStrong: '#3b4a26',
  textPrimary: '#ffffff',
  textSecondary: '#a6cd63',
  accent: '#a6cd63',
  onAccent: '#12140e',
  accentSoft: '#34401f',
  card: '#2c2c2c',
  border: '#4a4a4a',
  shadow: '#000000',
  mutedText: '#cfd1c6',
  inactive: '#8a8e82',
  danger: '#ff6b5e',
  dangerSoft: '#4a2522',
  onDangerSoft: '#ffd3cd',
  success: '#a6cd63',
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  veil: 'rgba(29, 29, 27, 0.6)',
  ink: '#ffffff',
  olive: '#a6cd63',
  onOlive: '#12140e',
  oliveSoft: '#3b4a26',
  onOliveSoft: '#dde6c6',
  oliveWash: 'rgba(166, 205, 99, 0.16)',
  lime: '#a6cd63',
  subtleText: '#b5b8ac',
  tint: '#333a29',
  cardBorder: '#4a4a4a',
  outline: '#5c5f55',
  subtleBorder: '#3a3a3a',
  bannerStart: '#111111',
  bannerEnd: '#2e502c',
  divider: 'rgba(255, 255, 255, 0.14)',
  highlightsStart: '#12140e',
  highlightsEnd: '#2f4419',
  flame: '#f5a623',
};

/** Theme-independent tokens, for module-level constants outside components. */
export const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    caption: 11,
    bodySmall: 13,
    body: 15,
    titleSmall: 17,
    title: 20,
    display: 28,
  },
  layout: {
    contentMaxWidth: 960,
    touchTarget: 44,
  },
};

const buildTheme = (scheme: ColorScheme, colors: ThemeColors) => ({
  scheme,
  dark: scheme === 'dark',
  colors,
  ...tokens,
  shadow: {
    card: {
      shadowColor: colors.shadow,
      shadowOpacity: scheme === 'dark' ? 0.3 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
});

export type Theme = ReturnType<typeof buildTheme>;

export const lightTheme: Theme = buildTheme('light', lightColors);
export const darkTheme: Theme = buildTheme('dark', darkColors);

export const getTheme = (scheme: string | null | undefined): Theme =>
  scheme === 'dark' ? darkTheme : lightTheme;

const subscribeToScheme = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  const unsubscribePreference = subscribeToThemePreference(onChange);
  return () => {
    subscription.remove();
    unsubscribePreference();
  };
};
const currentScheme = () => {
  const preference = getThemePreference();
  return preference === 'system' ? Appearance.getColorScheme() : preference;
};
// The static web export is rendered without a system appearance, in light.
// Hydration starts from that and then re-renders in the visitor's scheme;
// reading the scheme straight away would keep the server's light classes on
// the hydrated nodes.
const serverScheme = () => null;

/** The active theme: the appearance picked in the menu, else the system's. */
export function useTheme(): Theme {
  return getTheme(useSyncExternalStore(subscribeToScheme, currentScheme, serverScheme));
}

// StyleSheet.create's own input type. The web-only style values that
// `expo/types` (expo-env.d.ts) adds to ViewStyle are not accepted by it.
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

/**
 * Builds a `useStyles()` hook from a theme-aware style factory. Each theme's
 * sheet is created once and reused, so the returned object is stable per theme.
 */
export function makeStyles<S extends NamedStyles>(factory: (theme: Theme) => S & NamedStyles) {
  const sheets = new Map<Theme, Readonly<S>>();
  const stylesFor = (theme: Theme): Readonly<S> => {
    const cached = sheets.get(theme);
    if (cached) return cached;
    const sheet = StyleSheet.create(factory(theme)) as Readonly<S>;
    sheets.set(theme, sheet);
    return sheet;
  };
  return function useStyles(): Readonly<S> {
    return stylesFor(useTheme());
  };
}
