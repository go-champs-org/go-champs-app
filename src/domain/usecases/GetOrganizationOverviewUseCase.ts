import { AppError } from '../../core/errors/AppError';
import { OrganizationRepository } from '../repositories/OrganizationRepository';

export const ORGANIZATION_NOT_FOUND = 'Organização não encontrada.';

export type OrganizationTournament = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type OrganizationOverview = {
  organization: { id: string; name: string; slug: string; logoUrl: string | null };
  // In the API's order, as the public organization page lists them.
  tournaments: OrganizationTournament[];
};

export const tournamentsCountLabel = (count: number): string =>
  `${count} ${count === 1 ? 'campeonato' : 'campeonatos'}`;

export class GetOrganizationOverviewUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(slug: string, apiBaseUrl?: string): Promise<OrganizationOverview> {
    const [organization, tournaments] = await Promise.all([
      this.organizationRepository.getOrganizationBySlug(slug, apiBaseUrl),
      // A companion to the organization: an unreachable list degrades to an
      // empty one instead of taking the page down (the public page's rule).
      this.organizationRepository.getTournamentsByOrganizationSlug(slug, apiBaseUrl).catch(() => []),
    ]);

    if (!organization) throw new AppError(ORGANIZATION_NOT_FOUND, 404);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logo_url || null,
      },
      tournaments: tournaments.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        logoUrl: tournament.logo_url || null,
      })),
    };
  }
}
