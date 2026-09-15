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

export interface AccountRepository {
  signIn(credentials: SignInCredentials): Promise<AuthenticatedUser>;
  getAccountProfile(username: string): Promise<UserAccountProfile>;
}
