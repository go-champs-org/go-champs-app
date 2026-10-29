import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthSessionProvider } from '../src/auth/AuthSessionContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <StatusBar style="light" />
        <Slot />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
