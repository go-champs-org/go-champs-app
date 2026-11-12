import { NativeModules } from 'react-native';
import { createInstance, Types } from '@amplitude/analytics-react-native';
import { MemoryStorage, OfflineDisabled, Status } from '@amplitude/analytics-core';
import { AMPLITUDE_OPTIONS, loadAmplitude } from '../AmplitudeTransport';
import { validEvent } from '../events';

jest.mock('@amplitude/analytics-react-native', () => {
  const actual = jest.requireActual('@amplitude/analytics-react-native');
  return { ...actual, createInstance: jest.fn(actual.createInstance) };
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks();
  delete NativeModules.AmplitudeReactNative;
});

it('runs the real SDK pipeline with local-only transport, automatic sessions and privacy enrichment', async () => {
  const network = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network forbidden in this test'));
  const getContext = jest.fn().mockResolvedValue({ version: '1.0.0', build: '17', platform: 'iOS' });
  NativeModules.AmplitudeReactNative = { getApplicationContext: getContext };
  const captured: Types.Event[] = [];
  const realSdk = jest.requireActual<typeof import('@amplitude/analytics-react-native')>('@amplitude/analytics-react-native');
  jest.mocked(createInstance).mockImplementation(() => {
    const client = realSdk.createInstance();
    const init = client.init;
    client.init = (key, user, options) => init(key, user, {
      ...options, instanceName: 'gc12-local-integration',
      storageProvider: new MemoryStorage(), cookieStorage: new MemoryStorage(),
      offline: OfflineDisabled,
      flushQueueSize: 1,
      transportProvider: {
      send: async (_url, payload) => {
        captured.push(...payload.events);
        return { status: Status.Success, statusCode: 200,
          body: { eventsIngested: payload.events.length, payloadSizeBytes: 0, serverUploadTime: Date.now() } };
      },
      },
    });
    return client;
  });
  const transport = await loadAmplitude('local-test-key-only', { app_version: '1.0.0', build_number: '17', platform: 'ios' }, 'a'.repeat(64));
  transport.track('Screen Viewed', { screen_name: 'HomeTab' }, Date.now());
  await jest.advanceTimersByTimeAsync(1500);
  transport.flush();
  await jest.advanceTimersByTimeAsync(0);
  expect(captured.some((event) => event.event_type === 'session_start')).toBe(true);
  expect(captured.some((event) => event.event_type === 'Screen Viewed')).toBe(true);
  for (const event of captured) {
    expect(event.event_properties).toEqual(expect.objectContaining({ app_version: '1.0.0', build_number: '17', platform: 'ios' }));
    const { app_version: _version, build_number: _build, platform: _platform, ...custom } = event.event_properties as Record<string, unknown>;
    expect(validEvent(event.event_type, custom)).toBe(true);
    expect(event.user_id).toBe('a'.repeat(64));
    expect(event.ip).toBe('0.0.0.0');
    expect(event).not.toHaveProperty('idfa');
  }
  expect(getContext).toHaveBeenCalledWith(AMPLITUDE_OPTIONS.trackingOptions);
  await jest.advanceTimersByTimeAsync(300_000);
  expect(network).not.toHaveBeenCalled();
  network.mockRestore();
  delete NativeModules.AmplitudeReactNative;
});
