// Expo Router hands every URL the app is opened with to this hook first (iOS
// and Android only). The app's own NavigationContainer (./index) owns the
// links: it reads the same URL through React Navigation's linking and opens
// its screen. Expo Router only renders that container, so it stays on its root
// route for any link, and ignores links that arrive while the app is open.
export function redirectSystemPath({ initial }: { path: string; initial: boolean }): string | null {
  return initial ? '/' : null;
}
