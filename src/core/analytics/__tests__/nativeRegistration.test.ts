import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

it('registers ExpoApplication with the current iOS autolinker', () => {
  const packageDirectory = dirname(require.resolve('expo-application/package.json'));
  const config = JSON.parse(readFileSync(join(packageDirectory, 'expo-module.config.json'), 'utf8'));
  // SDK 58's current provider generator requires this explicit registration.
  expect(config.apple.modules).toContain('ApplicationModule');
});
