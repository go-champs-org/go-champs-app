import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuthSessionProvider, useAuthSession } from '../AuthSessionContext';
import { AuthTokenStore, StoredSession } from '../../core/auth/AuthTokenStore';
import { MutableTokenProvider } from '../../core/auth/MutableTokenProvider';
import { analytics } from '../../core/analytics/analytics';
import { deferred } from '../../test/deferred';

jest.mock('../../core/analytics/analytics', () => ({ analytics: { identify: jest.fn() } }));
jest.mock('../../di/container', () => ({ tokenProvider: { setToken: jest.fn() } }));

const session = { username: 'athlete-test', email: 'private@example.com', token: 'private-token' };
const mount = (load: () => Promise<StoredSession | null> = async () => session) => {
  const store: jest.Mocked<AuthTokenStore> = { load: jest.fn(load), save: jest.fn(), clear: jest.fn() };
  const tokenProvider = new MutableTokenProvider();
  const hook = renderHook(useAuthSession, {
    wrapper: ({ children }) => <AuthSessionProvider store={store} authTokenProvider={tokenProvider}>{children}</AuthSessionProvider>,
  });
  return { ...hook, store, tokenProvider };
};
beforeEach(() => jest.clearAllMocks());

it('restores identity without sending token/email and clears identity on logout', async () => {
  const { result, tokenProvider } = mount();
  await waitFor(() => expect(result.current.bootstrapping).toBe(false));
  expect(analytics.identify).toHaveBeenCalledWith('athlete-test');
  expect(tokenProvider.getToken()).toBe('private-token');
  await act(async () => { await result.current.signOut(); });
  expect(analytics.identify).toHaveBeenLastCalledWith(null);
  expect(result.current.user).toBeNull();
  expect(JSON.stringify(jest.mocked(analytics.identify).mock.calls)).not.toMatch(/private-token|private@example/);
});

it('identifies successful login and legacy session updates', async () => {
  const { result } = mount(async () => null);
  await waitFor(() => expect(result.current.bootstrapping).toBe(false));
  await act(async () => { await result.current.signIn(session); });
  expect(analytics.identify).toHaveBeenLastCalledWith('athlete-test');
  act(() => result.current.setUser(null));
  expect(analytics.identify).toHaveBeenLastCalledWith(null);
  act(() => result.current.setUser(session));
  expect(analytics.identify).toHaveBeenLastCalledWith('athlete-test');
});

it('boots anonymously on storage errors and never identifies an unmounted restore', async () => {
  const { result } = mount(async () => { throw new Error('storage unavailable'); });
  await waitFor(() => expect(result.current.bootstrapping).toBe(false));
  expect(analytics.identify).toHaveBeenLastCalledWith(null);
  jest.mocked(analytics.identify).mockClear();
  const pending = deferred<StoredSession | null>();
  const hook = mount(() => pending.promise);
  hook.unmount();
  await act(async () => { pending.resolve(session); await pending.promise; });
  expect(analytics.identify).not.toHaveBeenCalled();
});
