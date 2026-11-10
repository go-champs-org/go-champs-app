import { AppError } from '../../core/errors/AppError';

export type AuthenticatedUser = {
  email: string;
  token: string;
  username: string;
};

export type SignInCredentials = {
  password: string;
  username: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type UserAccountProfile = {
  email: string;
  username: string;
  organizations: UserOrganization[];
};

/** An organization that would be left without an owner if the account went away. */
export type SoleOwnedOrganization = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Why an account deletion failed. Only `session_expired` means the session is dead;
 * every other reason leaves the account and the session as they were.
 */
export type DeleteAccountFailure = 'invalid_password' | 'session_expired' | 'owns_organizations' | 'failed';

export class DeleteAccountError extends AppError {
  constructor(
    readonly reason: DeleteAccountFailure,
    message: string,
    status?: number,
    readonly organizations: SoleOwnedOrganization[] = []
  ) {
    super(message, status);
    this.name = 'DeleteAccountError';
  }
}

export interface AccountRepository {
  signIn(credentials: SignInCredentials): Promise<AuthenticatedUser>;
  getAccountProfile(username: string): Promise<UserAccountProfile>;
  /** Deletes the signed-in account. Rejects with a `DeleteAccountError`. */
  deleteAccount(password: string): Promise<void>;
}
