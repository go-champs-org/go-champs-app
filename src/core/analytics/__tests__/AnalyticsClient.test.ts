import { AnalyticsClient, AnalyticsTransport } from '../AnalyticsClient';
import { deferred } from '../../../test/deferred';

const HASH = 'a'.repeat(64);
const make = (enabled = true) => {
  const transport: jest.Mocked<AnalyticsTransport> = {
    setUserId: jest.fn(), reset: jest.fn(), track: jest.fn(), flush: jest.fn(),
  };
  const hashUsername = jest.fn().mockResolvedValue(HASH);
  const load = jest.fn().mockResolvedValue(transport);
  return { client: new AnalyticsClient({ enabled, hashUsername, load }), transport, hashUsername, load };
};

it('is a strict no-op when disabled, including native imports and hashing', async () => {
  const { client, load, hashUsername, transport } = make(false);
  client.identify('private'); client.track('Screen Viewed', { screen_name: 'HomeTab' }); client.flush();
  await client.settled();
  expect(load).not.toHaveBeenCalled(); expect(hashUsername).not.toHaveBeenCalled(); expect(transport.track).not.toHaveBeenCalled();
});

it('waits for saved authentication, then initializes with only the SHA-256 identity', async () => {
  const { client, transport, load, hashUsername } = make();
  client.track('Screen Viewed', { screen_name: 'HomeTab' });
  expect(load).not.toHaveBeenCalled();
  client.identify('athlete-test');
  await client.settled();
  expect(hashUsername).toHaveBeenCalledWith('athlete-test');
  expect(load).toHaveBeenCalledWith(HASH);
  expect(transport.track).toHaveBeenCalledWith('Screen Viewed', { screen_name: 'HomeTab' }, expect.any(Number));
  expect(JSON.stringify(transport.track.mock.calls)).not.toContain('athlete-test');
});

it('restores anonymously, identifies on login and resets on logout in order', async () => {
  const { client, transport, hashUsername } = make();
  client.identify(null); await client.settled();
  expect(hashUsername).not.toHaveBeenCalled();
  client.identify('athlete-test');
  client.track('Share Sheet Opened', { sticker: 'game' });
  client.identify(null); client.flush();
  await client.settled();
  expect(transport.setUserId).toHaveBeenCalledWith(HASH);
  expect(transport.setUserId.mock.invocationCallOrder[0]).toBeLessThan(transport.track.mock.invocationCallOrder[0]);
  expect(transport.track.mock.invocationCallOrder[0]).toBeLessThan(transport.reset.mock.invocationCallOrder[0]);
  expect(transport.flush).toHaveBeenCalled();
});

it('keeps UI calls synchronous while SDK initialization is pending', async () => {
  const { client, load, transport } = make();
  const pending = deferred<AnalyticsTransport>();
  load.mockReturnValue(pending.promise);
  client.identify(null);
  expect(client.track('Share Sheet Opened', { sticker: 'profile' })).toBeUndefined();
  expect(transport.track).not.toHaveBeenCalled();
  pending.resolve(transport); await client.settled();
  expect(transport.track).toHaveBeenCalledTimes(1);
});

it('fails closed for unrecognized properties or invalid hashes', async () => {
  const { client, transport, load, hashUsername } = make();
  client.track('Screen Viewed', { screen_name: 'HomeTab', email: 'private' } as never);
  hashUsername.mockResolvedValue('raw-username');
  client.identify('private'); await client.settled();
  expect(load).not.toHaveBeenCalled(); expect(transport.track).not.toHaveBeenCalled();
});

it('does not propagate SDK errors and can retry setup on a later identity change', async () => {
  const { client, transport, load } = make();
  load.mockRejectedValueOnce(new Error('offline'));
  client.identify(null); client.track('Share Sheet Opened', { sticker: 'profile' }); client.flush();
  await expect(client.settled()).resolves.toBeUndefined();
  client.identify(null); await client.settled();
  transport.track.mockImplementationOnce(() => { throw new Error('blocked'); });
  client.track('Share Sheet Opened', { sticker: 'game' });
  client.track('Share Sheet Opened', { sticker: 'profile' });
  await expect(client.settled()).resolves.toBeUndefined();
  expect(transport.track).toHaveBeenCalledTimes(2);
});

it('bounds the startup buffer and clones caller-owned arrays', async () => {
  const { client, transport } = make();
  const fields: ('name' | 'instagram')[] = ['name'];
  client.track('Athlete Profile Saved', { is_new: false, changed_fields: fields });
  fields.push('instagram');
  for (let index = 0; index < 110; index++) client.track('Screen Viewed', { screen_name: 'HomeTab' });
  client.identify(null); await client.settled();
  expect(transport.track).toHaveBeenCalledTimes(100);
  expect(transport.track.mock.calls[0][1]).toEqual({ is_new: false, changed_fields: ['name'] });
});
