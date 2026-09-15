import { CreateAthleteProfileUseCase } from '../CreateAthleteProfileUseCase';
import { GetAccountProfileUseCase } from '../GetAccountProfileUseCase';
import { GetAthleteProfileByUsernameUseCase } from '../GetAthleteProfileByUsernameUseCase';
import { GetAthleteSchedulesUseCase } from '../GetAthleteSchedulesUseCase';
import { GetOrganizationsUseCase } from '../GetOrganizationsUseCase';
import { GetRecentTournamentsUseCase } from '../GetRecentTournamentsUseCase';
import { GetTournamentHistoryUseCase } from '../GetTournamentHistoryUseCase';
import { UpdateAthleteProfileUseCase } from '../UpdateAthleteProfileUseCase';
import { AccountRepository } from '../../repositories/AccountRepository';
import { AthleteProfileRepository } from '../../repositories/AthleteProfileRepository';
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

  it('delegates account and athlete profile use cases', async () => {
    const accountRepository = {
      getAccountProfile: jest.fn().mockResolvedValue({ email: 'a@b.c', username: 'ana', organizations: [] }),
    } as unknown as AccountRepository;
    const athleteRepository = {
      getByUsername: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', username: 'ana', name: 'Ana' }),
      updateByUsername: jest.fn().mockResolvedValue({ id: '1', username: 'ana', name: 'Ana 2' }),
      getMySchedules: jest.fn().mockResolvedValue([]),
    } as unknown as AthleteProfileRepository;

    await expect(new GetAccountProfileUseCase(accountRepository).execute('ana')).resolves.toEqual({
      email: 'a@b.c',
      username: 'ana',
      organizations: [],
    });
    await expect(new GetAthleteProfileByUsernameUseCase(athleteRepository).execute('ana')).resolves.toBeNull();
    await expect(new CreateAthleteProfileUseCase(athleteRepository).execute({ name: 'Ana' })).resolves.toEqual({
      id: '1',
      username: 'ana',
      name: 'Ana',
    });
    await expect(new UpdateAthleteProfileUseCase(athleteRepository).execute('ana', { name: 'Ana 2' })).resolves.toEqual({
      id: '1',
      username: 'ana',
      name: 'Ana 2',
    });
    await expect(new GetAthleteSchedulesUseCase(athleteRepository).execute()).resolves.toEqual([]);
  });
});
