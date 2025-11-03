import { Stack } from "expo-router";
import { theme } from "./src/theme/theme";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerShown: false,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: 'normal', fontSize: 16 },
      }}
    />
  );
}
