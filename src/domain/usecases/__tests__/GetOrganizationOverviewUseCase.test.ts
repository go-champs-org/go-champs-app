import { AppError } from '../../../core/errors/AppError';
import { tournamentFixture } from '../../../test/fixtures/tournamentFixtures';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import {
  GetOrganizationOverviewUseCase,
  ORGANIZATION_NOT_FOUND,
  tournamentsCountLabel,
} from '../GetOrganizationOverviewUseCase';

const API = 'https://api.test/v1';
const ORGANIZATION = { id: 'org-1', name: 'NLBB', slug: 'nlbb', logo_url: 'https://logo/org.png' };

const repositoryWith = (organization: jest.Mock, tournaments: jest.Mock) =>
  ({
    getOrganizationBySlug: organization,
    getTournamentsByOrganizationSlug: tournaments,
  }) as unknown as OrganizationRepository;

describe('GetOrganizationOverviewUseCase', () => {
  it('builds the organization identity and its tournaments in API order', async () => {
    const organization = jest.fn().mockResolvedValue(ORGANIZATION);
    const tournaments = jest.fn().mockResolvedValue([
      { ...tournamentFixture, id: 't2', name: 'Taça Bauru', logo_url: 'https://logo/t2.png' },
      { ...tournamentFixture, id: 't1', name: 'Copa Paulista', logo_url: '' },
    ]);

    const overview = await new GetOrganizationOverviewUseCase(repositoryWith(organization, tournaments)).execute(
      'nlbb',
      API
    );

    expect(organization).toHaveBeenCalledWith('nlbb', API);
    expect(tournaments).toHaveBeenCalledWith('nlbb', API);
    expect(overview).toEqual({
      organization: { id: 'org-1', name: 'NLBB', slug: 'nlbb', logoUrl: 'https://logo/org.png' },
      tournaments: [
        { id: 't2', name: 'Taça Bauru', logoUrl: 'https://logo/t2.png' },
        { id: 't1', name: 'Copa Paulista', logoUrl: null },
      ],
    });
  });

  it('shows the organization without tournaments when their list fails', async () => {
    const overview = await new GetOrganizationOverviewUseCase(
      repositoryWith(
        jest.fn().mockResolvedValue({ ...ORGANIZATION, logo_url: null }),
        jest.fn().mockRejectedValue(new Error('offline'))
      )
    ).execute('nlbb');

    expect(overview.organization.logoUrl).toBeNull();
    expect(overview.tournaments).toEqual([]);
  });

  it('fails with a not found error when the slug matches no organization', async () => {
    const execution = new GetOrganizationOverviewUseCase(
      repositoryWith(jest.fn().mockResolvedValue(null), jest.fn().mockResolvedValue([]))
    ).execute('missing');

    await expect(execution).rejects.toEqual(new AppError(ORGANIZATION_NOT_FOUND, 404));
  });

  it('lets a failed organization request fail', async () => {
    const execution = new GetOrganizationOverviewUseCase(
      repositoryWith(jest.fn().mockRejectedValue(new Error('offline')), jest.fn().mockResolvedValue([]))
    ).execute('nlbb');

    await expect(execution).rejects.toThrow('offline');
  });
});

describe('tournamentsCountLabel', () => {
  it('counts the tournaments in Portuguese', () => {
    expect(tournamentsCountLabel(0)).toBe('0 campeonatos');
    expect(tournamentsCountLabel(1)).toBe('1 campeonato');
    expect(tournamentsCountLabel(12)).toBe('12 campeonatos');
  });
});
