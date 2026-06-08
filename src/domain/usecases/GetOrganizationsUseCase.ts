import { OrganizationRepository } from '../repositories/OrganizationRepository';

export class GetOrganizationsUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  execute() {
    return this.organizationRepository.getOrganizations();
  }
}

