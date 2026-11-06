import { Organization } from '../../models/Organization';
import { Tournament } from '../../models/Tournament';

export interface OrganizationRepository {
  // null when no organization has that slug.
  getOrganizationBySlug(slug: string, apiBaseUrl?: string): Promise<Organization | null>;
  getTournamentsByOrganizationSlug(slug: string, apiBaseUrl?: string): Promise<Tournament[]>;
  // Most viewed first, like the public home sidebar.
  getRecentlyViewedOrganizations(): Promise<Organization[]>;
  getOrganizations(): Promise<Organization[]>;
}
