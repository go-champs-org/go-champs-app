import { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';
import { Organization } from '../../models/Organization';
import { Tournament } from '../../models/Tournament';
import { ApiResponse } from '../dto/ApiResponses';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';

// The same filters the public organization page sends
// (packages/api-client getOrganizationBySlug, getTournamentsByOrganizationSlug).
export class GoChampsOrganizationRepository implements OrganizationRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async getOrganizationBySlug(slug: string, apiBaseUrl?: string): Promise<Organization | null> {
    const response = await this.apiClient.get<ApiResponse<Organization[]>>(
      `/organizations?where[slug]=${encodeURIComponent(slug)}`,
      apiBaseUrl
    );
    return response.data?.[0] ?? null;
  }

  async getTournamentsByOrganizationSlug(slug: string, apiBaseUrl?: string): Promise<Tournament[]> {
    const response = await this.apiClient.get<ApiResponse<Tournament[]>>(
      `/tournaments?where[organization_slug]=${encodeURIComponent(slug)}`,
      apiBaseUrl
    );
    return response.data ?? [];
  }
}
