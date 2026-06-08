import { Organization } from '../../models/Organization';

export interface OrganizationRepository {
  getOrganizations(): Promise<Organization[]>;
}

