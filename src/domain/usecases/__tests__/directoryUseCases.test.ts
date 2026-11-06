import { GetOrganizationDirectoryUseCase } from '../GetOrganizationDirectoryUseCase';
import { SearchTournamentsUseCase } from '../SearchTournamentsUseCase';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { tournamentFixture } from '../../../test/fixtures/tournamentFixtures';

const organization = tournamentFixture.organization;

describe('SearchTournamentsUseCase', () => {
  it('searches the trimmed term', async () => {
    const searchTournaments = jest.fn().mockResolvedValue([tournamentFixture]);
    const useCase = new SearchTournamentsUseCase({ searchTournaments } as unknown as TournamentRepository);

    await expect(useCase.execute('  copa ')).resolves.toEqual([tournamentFixture]);
    expect(searchTournaments).toHaveBeenCalledWith('copa');
  });

  it('asks nothing for a blank term', async () => {
    const searchTournaments = jest.fn();
    const useCase = new SearchTournamentsUseCase({ searchTournaments } as unknown as TournamentRepository);

    await expect(useCase.execute('   ')).resolves.toEqual([]);
    expect(searchTournaments).not.toHaveBeenCalled();
  });
});

describe('GetOrganizationDirectoryUseCase', () => {
  it('loads the most viewed and all organizations', async () => {
    const repository = {
      getRecentlyViewedOrganizations: jest.fn().mockResolvedValue([organization]),
      getOrganizations: jest.fn().mockResolvedValue([organization, { ...organization, id: 'org-2' }]),
    } as unknown as OrganizationRepository;

    const directory = await new GetOrganizationDirectoryUseCase(repository).execute();
    expect(directory.recent).toEqual([organization]);
    expect(directory.all).toHaveLength(2);
  });

  it('degrades each failing list to empty', async () => {
    const repository = {
      getRecentlyViewedOrganizations: jest.fn().mockRejectedValue(new Error('offline')),
      getOrganizations: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as OrganizationRepository;

    await expect(new GetOrganizationDirectoryUseCase(repository).execute()).resolves.toEqual({ recent: [], all: [] });
  });
});
