import { createInstance, Types } from '@amplitude/analytics-react-native';
import { AMPLITUDE_OPTIONS, loadAmplitude, privacyPlugin } from '../AmplitudeTransport';

jest.mock('@amplitude/analytics-react-native', () => ({ createInstance: jest.fn(), Types: { LogLevel: { None: 0 } } }));
const HASH = 'a'.repeat(64);
const DEVICE = 'c6a0c578-16e8-4f91-80ae-fbced0c8d8ba';
const metadata = { app_version: '1.0.0', build_number: '17', platform: 'android' as const };

it('enriches custom and automatic session events and removes all undeclared envelope data', async () => {
  const plugin = privacyPlugin(metadata);
  const event = await plugin.execute({
    event_type: 'Screen Viewed', event_properties: { screen_name: 'HomeTab' }, user_id: HASH, device_id: DEVICE,
    user_properties: { email: 'private@example.com' }, ip: '192.0.2.1', adid: 'private', idfa: 'private',
    location_lat: 30, country: 'private', groups: { team: 'private' },
  });
  expect(event).toEqual(expect.objectContaining({ event_properties: { screen_name: 'HomeTab', ...metadata }, user_id: HASH, device_id: DEVICE, ip: '0.0.0.0' }));
  for (const key of ['user_properties', 'adid', 'idfa', 'country', 'location_lat', 'groups']) expect(event).not.toHaveProperty(key);
  expect(JSON.stringify(event)).not.toContain('private');
  for (const name of ['session_start', 'session_end']) {
    expect(await plugin.execute({ event_type: name, user_id: 'raw-username', device_id: 'private@example.com' }))
      .toEqual(expect.objectContaining({ event_type: name, event_properties: metadata, user_id: undefined, device_id: undefined }));
  }
});

it('drops unexpected SDK events and properties, including automatically captured interactions', async () => {
  const plugin = privacyPlugin(metadata);
  expect(await plugin.execute({ event_type: '[Amplitude] Element Interacted', event_properties: { name: 'private' } })).toBeNull();
  expect(await plugin.execute({ event_type: 'Screen Viewed', event_properties: { screen_name: 'HomeTab', username: 'private' } })).toBeNull();
});

it('disables ad identifiers, IP, remote config, attribution, diagnostics logging and all autocapture', () => {
  expect(AMPLITUDE_OPTIONS).toMatchObject({ autocapture: false, trackingSessionEvents: true, logLevel: 0,
    remoteConfig: { fetchRemoteConfig: false }, attribution: { disabled: true }, migrateLegacyData: false });
  expect(Object.values(AMPLITUDE_OPTIONS.trackingOptions).every((value) => value === false)).toBe(true);
});

const mockClient = () => {
  const client = {
    add: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    init: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    setUserId: jest.fn(), reset: jest.fn(), getUserId: jest.fn().mockReturnValue(HASH),
    getDeviceId: jest.fn().mockReturnValue(DEVICE),
    track: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    flush: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
  };
  jest.mocked(createInstance).mockReturnValue(client as unknown as Types.ReactNativeClient);
  return client;
};

it('installs the privacy plugin before SDK init and never awaits HTTP responses', async () => {
  const client = mockClient();
  const transport = await loadAmplitude('test-key', metadata, HASH);
  expect(client.add.mock.invocationCallOrder[0]).toBeLessThan(client.init.mock.invocationCallOrder[0]);
  expect(client.init).toHaveBeenCalledWith('test-key', HASH, AMPLITUDE_OPTIONS);
  transport.track('Share Sheet Opened', { sticker: 'profile' }, 123);
  expect(client.track).toHaveBeenCalledWith('Share Sheet Opened', { sticker: 'profile' }, { time: 123, user_id: HASH, device_id: DEVICE });
  transport.setUserId(HASH); transport.reset(); transport.flush();
  expect(client.setUserId).toHaveBeenCalledWith(HASH);
  expect(client.reset).toHaveBeenCalled(); expect(client.flush).toHaveBeenCalled();
});

it('overrides a stale persisted login before session initialization, without rotating anonymous devices', async () => {
  const client = mockClient();
  await loadAmplitude('test-key', metadata);
  expect(client.init).toHaveBeenCalledWith('test-key', '', AMPLITUDE_OPTIONS);
  expect(client.setUserId).toHaveBeenCalledWith(undefined);
  expect(client.reset).not.toHaveBeenCalled();
});

it('contains rejected SDK dispatch/flush promises', async () => {
  const client = mockClient();
  const transport = await loadAmplitude('test-key', metadata, HASH);
  client.track.mockReturnValue({ promise: Promise.reject(new Error('blocked')) });
  client.flush.mockReturnValue({ promise: Promise.reject(new Error('blocked')) });
  expect(transport.track('session_end', {}, 123)).toBeUndefined();
  expect(transport.flush()).toBeUndefined();
  await Promise.resolve();
});
