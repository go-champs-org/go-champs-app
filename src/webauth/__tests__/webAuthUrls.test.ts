import { isWebAuthSuccessUrl, webAuthStartUrl } from '../webAuthUrls';

describe('webAuthUrls', () => {
  it('exposes start urls', () => {
    expect(webAuthStartUrl.signUp).toContain('/SignUp');
    expect(webAuthStartUrl.accountRecovery).toContain('/AccountRecovery');
    expect(webAuthStartUrl.accountCredentials).toContain('/Account');
  });

  it('detects signup success urls', () => {
    expect(isWebAuthSuccessUrl('https://go-champs.com/SignIn', 'signUp')).toBe(true);
    expect(isWebAuthSuccessUrl('https://go-champs.com/SignUp', 'signUp')).toBe(false);
    expect(isWebAuthSuccessUrl('https://evil.com/SignIn', 'signUp')).toBe(false);
  });

  it('detects recovery success urls', () => {
    expect(isWebAuthSuccessUrl('https://go-champs.com/Account', 'accountRecovery')).toBe(true);
    expect(isWebAuthSuccessUrl('https://go-champs.com/AccountRecovery', 'accountRecovery')).toBe(false);
  });
});
