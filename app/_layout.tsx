import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from "../src/theme/theme";
import { AuthSessionProvider } from '../src/auth/AuthSessionContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <StatusBar style="light" backgroundColor={theme.colors.primary} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
            headerShown: false,
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: '800', fontSize: 16 },
          }}
        />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
