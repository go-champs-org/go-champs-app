import { MutableTokenProvider } from '../MutableTokenProvider';

describe('MutableTokenProvider', () => {
  it('stores and clears the current token', () => {
    const provider = new MutableTokenProvider();
    expect(provider.getToken()).toBeNull();
    provider.setToken('abc');
    expect(provider.getToken()).toBe('abc');
    provider.setToken(null);
    expect(provider.getToken()).toBeNull();
  });
});
