import { API_CONFIG } from '../../core/config/apiConfig';
import { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';
import { Organization } from '../../models/Organization';
import { ApiResponse } from '../dto/ApiResponses';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';

export class GoChampsOrganizationRepository implements OrganizationRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await this.apiClient.get<ApiResponse<Organization[]>>(
        '/api/organizations',
        API_CONFIG.stagingBaseUrl
      );
      return response.data;
    } catch {
      return [];
    }
  }
}

