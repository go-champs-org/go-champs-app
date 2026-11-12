import { createInstance, Types } from '@amplitude/analytics-react-native';
import { AnalyticsTransport } from './AnalyticsClient';
import { AnalyticsMetadata, safeProperties } from './events';

export const AMPLITUDE_OPTIONS = {
  instanceName: 'go-champs-native',
  autocapture: false,
  trackingSessionEvents: true,
  migrateLegacyData: false,
  disableCookies: true,
  remoteConfig: { fetchRemoteConfig: false },
  attribution: { disabled: true },
  trackingOptions: {
    adid: false, appSetId: false, idfv: false, ipAddress: false, country: false,
    carrier: false, deviceManufacturer: false, deviceModel: false,
    language: false, osName: false, osVersion: false, platform: false,
  },
  logLevel: Types.LogLevel.None,
} satisfies Types.ReactNativeOptions;

export function privacyPlugin(metadata: AnalyticsMetadata) {
  return {
    name: 'go-champs-allowlist', type: 'enrichment',
    execute: async (event) => {
      const properties = safeProperties(event.event_type, event.event_properties ?? {}, metadata);
      if (!properties) return null;
      // Explicitly reconstruct the envelope; SDK/plugins cannot add personal data.
      return {
        event_type: event.event_type,
        event_properties: properties,
        user_id: typeof event.user_id === 'string' && /^[a-f0-9]{64}$/.test(event.user_id) ? event.user_id : undefined,
        device_id: typeof event.device_id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(event.device_id)
          ? event.device_id : undefined,
        session_id: event.session_id,
        time: event.time,
        insert_id: event.insert_id,
        event_id: event.event_id,
        library: 'amplitude-react-native',
        app_version: metadata.app_version,
        platform: metadata.platform,
        ip: '0.0.0.0',
      };
    },
  } satisfies Types.EnrichmentPlugin;
}

export async function loadAmplitude(apiKey: string, metadata: AnalyticsMetadata, userId?: string): Promise<AnalyticsTransport> {
  const client = createInstance();
  await client.add(privacyPlugin(metadata)).promise;
  // Empty explicitly overrides a persisted login; undefined restores SDK storage.
  // The enrichment plugin removes it from automatic session events.
  await client.init(apiKey, userId ?? '', AMPLITUDE_OPTIONS).promise;
  if (!userId) client.setUserId(undefined);
  return {
    setUserId: (id) => client.setUserId(id),
    reset: () => client.reset(),
    track: (name, properties, time) => {
      void client.track(name, properties, { time, user_id: client.getUserId(), device_id: client.getDeviceId() })
        .promise.catch(() => undefined);
    },
    flush: () => { void client.flush().promise.catch(() => undefined); },
  };
}
