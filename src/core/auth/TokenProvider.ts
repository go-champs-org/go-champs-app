export interface TokenProvider {
  getToken(): string | null;
}
