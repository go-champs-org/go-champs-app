import { Organization } from '../../models/Organization';
import { OrganizationRepository } from '../repositories/OrganizationRepository';

export type OrganizationDirectory = {
  // Most viewed first, the list shown before anything is typed.
  recent: Organization[];
  // Every organization, the pool the search looks at.
  all: Organization[];
};

// A failing endpoint degrades to an empty list, like the public home sidebar.
export class GetOrganizationDirectoryUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(): Promise<OrganizationDirectory> {
    const [recent, all] = await Promise.all([
      this.organizationRepository.getRecentlyViewedOrganizations().catch(() => []),
      this.organizationRepository.getOrganizations().catch(() => []),
    ]);
    return { recent, all };
  }
}
