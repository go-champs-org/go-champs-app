/* eslint-disable @typescript-eslint/no-require-imports -- Native modules must load only after the runtime opt-in. */
import { Platform } from 'react-native';
import { AnalyticsClient } from './AnalyticsClient';
import { ScreenTracker } from './ScreenTracker';

export function analyticsEnabled(platform: string, key: string | undefined, development: boolean, testing: boolean) {
  return (platform === 'ios' || platform === 'android') && Boolean(key?.trim()) && !development && !testing;
}

const apiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
const platform = Platform.OS;

export const analytics = new AnalyticsClient({
  enabled: analyticsEnabled(platform, apiKey, __DEV__, process.env.NODE_ENV === 'test'),
  hashUsername: async (username) => {
    const crypto: typeof import('expo-crypto') = require('expo-crypto');
    return crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.SHA256, username, { encoding: crypto.CryptoEncoding.HEX });
  },
  load: async (userId) => {
    const { loadAmplitude }: typeof import('./AmplitudeTransport') = require('./AmplitudeTransport');
    const application: typeof import('expo-application') = require('expo-application');
    return loadAmplitude(apiKey!, {
      app_version: application.nativeApplicationVersion ?? 'unknown',
      build_number: application.nativeBuildVersion ?? 'unknown',
      platform: platform as 'ios' | 'android',
    }, userId);
  },
});

export const analyticsScreens = new ScreenTracker(analytics);
