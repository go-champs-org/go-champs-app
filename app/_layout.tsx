import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={
    {
      headerStyle: { backgroundColor: '#c22' },
      headerTintColor: '#fff',
      headerShown: false,
      headerTitleAlign: 'center',
      headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
    }
  } />;
}
