import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthSessionProvider } from '../src/auth/AuthSessionContext';
import { useTheme } from '../src/theme/theme';
import { loadThemePreference } from '../src/theme/themePreference';

export default function RootLayout() {
  const theme = useTheme();

  useEffect(() => {
    void loadThemePreference();
  }, []);

  // The root view shows behind modals and while screens transition.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
    // On the web, the page behind the app (overscroll) and browser-drawn
    // scrollbars and form controls follow the active theme too.
    if (Platform.OS === 'web') {
      document.documentElement.style.background = theme.colors.background;
      document.documentElement.style.colorScheme = theme.scheme;
    }
  }, [theme]);

  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        {/* Every screen opens on the dark header, in either theme. */}
        <StatusBar style="light" />
        <Slot />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
