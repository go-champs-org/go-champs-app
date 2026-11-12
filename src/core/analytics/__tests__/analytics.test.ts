import { analyticsEnabled, analytics } from '../analytics';

it.each(['ios', 'android'])('enables only native production with a key (%s)', (platform) => {
  expect(analyticsEnabled(platform, 'key', false, false)).toBe(true);
  expect(analyticsEnabled(platform, undefined, false, false)).toBe(false);
  expect(analyticsEnabled(platform, '   ', false, false)).toBe(false);
  expect(analyticsEnabled(platform, 'key', true, false)).toBe(false);
  expect(analyticsEnabled(platform, 'key', false, true)).toBe(false);
});

it.each(['web', 'windows', 'macos'])('never enables %s, even with the production key', (platform) => {
  expect(analyticsEnabled(platform, 'key', false, false)).toBe(false);
});

it('does not import or initialize the SDK in the actual Jest runtime', async () => {
  analytics.identify('private'); analytics.track('Screen Viewed', { screen_name: 'HomeTab' }); analytics.flush();
  await expect(analytics.settled()).resolves.toBeUndefined();
});

it.each([true, false])('loads native metadata and SHA-256 only after opting in (metadata=%s)', async (hasMetadata) => {
  const hash = jest.fn().mockResolvedValue('a'.repeat(64));
  const load = jest.fn().mockResolvedValue({ track: jest.fn(), setUserId: jest.fn(), reset: jest.fn(), flush: jest.fn() });
  jest.doMock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, CryptoEncoding: { HEX: 'hex' }, digestStringAsync: hash }));
  jest.doMock('expo-application', () => ({ nativeApplicationVersion: hasMetadata ? '1.0.0' : null, nativeBuildVersion: hasMetadata ? '17' : null }));
  jest.doMock('../AmplitudeTransport', () => ({ loadAmplitude: load }));
  jest.replaceProperty(global as typeof globalThis & { __DEV__: boolean }, '__DEV__', false);
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production', EXPO_PUBLIC_AMPLITUDE_API_KEY: 'test-only-key' });
  try {
    await jest.isolateModulesAsync(async () => {
      const { analytics: app } = jest.requireActual<typeof import('../analytics')>('../analytics');
      app.identify('athlete-test'); await app.settled();
      expect(hash).toHaveBeenCalledWith('SHA-256', 'athlete-test', { encoding: 'hex' });
      expect(load).toHaveBeenCalledWith('test-only-key', {
        app_version: hasMetadata ? '1.0.0' : 'unknown', build_number: hasMetadata ? '17' : 'unknown', platform: 'ios',
      }, 'a'.repeat(64));
    });
  } finally { jest.restoreAllMocks(); }
});
