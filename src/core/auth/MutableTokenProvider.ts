import { TokenProvider } from './TokenProvider';

export class MutableTokenProvider implements TokenProvider {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }
}
