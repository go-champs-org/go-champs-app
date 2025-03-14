import { Organization } from './Organization';

export type Tournament = {
  id: string;
  name: string;
  slug: string;
  organization: Organization;
};