export type StoredSession = {
  token: string;
  username: string;
  email: string;
};

export interface AuthTokenStore {
  load(): Promise<StoredSession | null>;
  save(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}
