import { GetOrganizationsUseCase } from '../GetOrganizationsUseCase';
import { GetRecentTournamentsUseCase } from '../GetRecentTournamentsUseCase';
import { GetTournamentHistoryUseCase } from '../GetTournamentHistoryUseCase';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { tournamentFixture, tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';

describe('simple use cases', () => {
  it('delegates recent tournaments to repository', async () => {
    const repository = {
      getRecentTournaments: jest.fn().mockResolvedValue([tournamentFixture]),
    } as unknown as TournamentRepository;

    await expect(new GetRecentTournamentsUseCase(repository).execute()).resolves.toEqual([tournamentFixture]);
  });

  it('delegates tournament history to repository', async () => {
    const repository = {
      getTournamentHistory: jest.fn().mockResolvedValue(tournamentHistoryFixture),
    } as unknown as TournamentRepository;

    await expect(new GetTournamentHistoryUseCase(repository).execute('tournament-1')).resolves.toEqual(
      tournamentHistoryFixture
    );
  });

  it('delegates organizations to repository', async () => {
    const repository = {
      getOrganizations: jest.fn().mockResolvedValue([tournamentFixture.organization]),
    } as unknown as OrganizationRepository;

    await expect(new GetOrganizationsUseCase(repository).execute()).resolves.toEqual([tournamentFixture.organization]);
  });
});
