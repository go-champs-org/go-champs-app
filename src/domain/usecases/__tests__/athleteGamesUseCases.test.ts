import { AppError } from '../../../core/errors/AppError';
import { AthleteProfileRepository } from '../../repositories/AthleteProfileRepository';
import { GetAthleteGamesUseCase } from '../GetAthleteGamesUseCase';
import { GetAthleteHomeUseCase } from '../GetAthleteHomeUseCase';

const profile = { id: 'a1', username: 'ana', name: 'Ana', photo_url: null, facebook: null, instagram: null, twitter: null };
const teamGame = { id: 'g1', athlete_team_id: 'team-a' };
const recentGame = { game: { id: 'g0' }, athlete_team_id: 'team-a', result: 'win', stats: {} };

const repositoryWith = (overrides: Partial<jest.Mocked<AthleteProfileRepository>> = {}) =>
  ({
    getByUsername: jest.fn().mockResolvedValue(profile),
    create: jest.fn(),
    updateByUsername: jest.fn(),
    getTeamSchedule: jest.fn().mockResolvedValue([teamGame]),
    getRecentGames: jest.fn().mockResolvedValue([recentGame]),
    ...overrides,
  }) as jest.Mocked<AthleteProfileRepository>;

const notFound = () => Promise.reject(new AppError('Athlete profile not found', 404));

describe('GetAthleteHomeUseCase', () => {
  it('loads the profile and its recent games together', async () => {
    const repository = repositoryWith();
    await expect(new GetAthleteHomeUseCase(repository).execute('ana')).resolves.toEqual({
      profile,
      recentGames: [recentGame],
    });
    expect(repository.getByUsername).toHaveBeenCalledWith('ana');
    expect(repository.getRecentGames).toHaveBeenCalledWith('ana');
    expect(repository.getTeamSchedule).not.toHaveBeenCalled();
  });

  it('reads a missing athlete profile as no profile and no games', async () => {
    const repository = repositoryWith({
      getByUsername: jest.fn().mockResolvedValue(null),
      getRecentGames: jest.fn().mockImplementation(notFound),
    });
    await expect(new GetAthleteHomeUseCase(repository).execute('ana')).resolves.toEqual({
      profile: null,
      recentGames: [],
    });
  });

  it('fails when the recent games fail for another reason', async () => {
    const repository = repositoryWith({
      getRecentGames: jest.fn().mockRejectedValue(new AppError('offline', 500)),
    });
    await expect(new GetAthleteHomeUseCase(repository).execute('ana')).rejects.toMatchObject({ status: 500 });
  });

  it('fails when the profile exists but its recent games are not found', async () => {
    const repository = repositoryWith({ getRecentGames: jest.fn().mockImplementation(notFound) });
    await expect(new GetAthleteHomeUseCase(repository).execute('ana')).rejects.toMatchObject({ status: 404 });
  });
});

describe('GetAthleteGamesUseCase', () => {
  it("loads the profile, the team schedule and the recent games", async () => {
    const repository = repositoryWith();
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).resolves.toEqual({
      profile,
      teamGames: [teamGame],
      recentGames: [recentGame],
    });
    expect(repository.getTeamSchedule).toHaveBeenCalledWith('ana');
  });

  it('returns no games without an athlete profile', async () => {
    const repository = repositoryWith({
      getByUsername: jest.fn().mockResolvedValue(null),
      getTeamSchedule: jest.fn().mockImplementation(notFound),
      getRecentGames: jest.fn().mockImplementation(notFound),
    });
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).resolves.toEqual({
      profile: null,
      teamGames: [],
      recentGames: [],
    });
  });

  it('fails when the schedule fails', async () => {
    const repository = repositoryWith({ getTeamSchedule: jest.fn().mockRejectedValue(new TypeError('offline')) });
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).rejects.toThrow('offline');
  });

  it('fails when the profile exists but its recent games are not found', async () => {
    const repository = repositoryWith({ getRecentGames: jest.fn().mockImplementation(notFound) });
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).rejects.toMatchObject({ status: 404 });
  });

  it('ignores failed lists without an athlete profile', async () => {
    const repository = repositoryWith({
      getByUsername: jest.fn().mockResolvedValue(null),
      getTeamSchedule: jest.fn().mockRejectedValue(new AppError('offline', 500)),
    });
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).resolves.toMatchObject({ profile: null });
  });

  it('fails when the profile fails', async () => {
    const repository = repositoryWith({ getByUsername: jest.fn().mockRejectedValue(new AppError('offline', 500)) });
    await expect(new GetAthleteGamesUseCase(repository).execute('ana')).rejects.toMatchObject({ status: 500 });
  });
});
