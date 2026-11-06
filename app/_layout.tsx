import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthSessionProvider } from '../src/auth/AuthSessionContext';
import { useTheme } from '../src/theme/theme';

export default function RootLayout() {
  const theme = useTheme();

  // The root view shows behind modals and while screens transition.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
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
