import { Organization } from './Organization';

export type Tournament = {
  id: string;
  apiBaseUrl?: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  organization: Organization;
};
