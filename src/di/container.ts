import { MutableTokenProvider } from '../core/auth/MutableTokenProvider';
import { FetchHttpClient } from '../core/http/FetchHttpClient';
import { TournamentFallbackDataSource } from '../data/datasources/local/TournamentFallbackDataSource';
import { GoChampsApiClient } from '../data/datasources/remote/GoChampsApiClient';
import { GoChampsAccountRepository } from '../data/repositories/GoChampsAccountRepository';
import { GoChampsAthleteProfileRepository } from '../data/repositories/GoChampsAthleteProfileRepository';
import { GoChampsOrganizationRepository } from '../data/repositories/GoChampsOrganizationRepository';
import { GoChampsTournamentRepository } from '../data/repositories/GoChampsTournamentRepository';
import { CreateAthleteProfileUseCase } from '../domain/usecases/CreateAthleteProfileUseCase';
import { GetAccountProfileUseCase } from '../domain/usecases/GetAccountProfileUseCase';
import { GetAthleteProfileByUsernameUseCase } from '../domain/usecases/GetAthleteProfileByUsernameUseCase';
import { GetAthleteSchedulesUseCase } from '../domain/usecases/GetAthleteSchedulesUseCase';
import { GetClassificationOverviewUseCase } from '../domain/usecases/GetClassificationOverviewUseCase';
import { GetGroupPhaseOverviewUseCase } from '../domain/usecases/GetGroupPhaseOverviewUseCase';
import { GetOrganizationsUseCase } from '../domain/usecases/GetOrganizationsUseCase';
import { GetPlayoffOverviewUseCase } from '../domain/usecases/GetPlayoffOverviewUseCase';
import { GetRecentTournamentsUseCase } from '../domain/usecases/GetRecentTournamentsUseCase';
import { GetTournamentHistoryUseCase } from '../domain/usecases/GetTournamentHistoryUseCase';
import { ResolvePhaseDestinationUseCase } from '../domain/usecases/ResolvePhaseDestinationUseCase';
import { SignInUseCase } from '../domain/usecases/SignInUseCase';
import { UpdateAthleteProfileUseCase } from '../domain/usecases/UpdateAthleteProfileUseCase';

const httpClient = new FetchHttpClient();
export const tokenProvider = new MutableTokenProvider();
const apiClient = new GoChampsApiClient(httpClient, tokenProvider);
const fallbackDataSource = new TournamentFallbackDataSource();

const tournamentRepository = new GoChampsTournamentRepository(apiClient, fallbackDataSource);
const organizationRepository = new GoChampsOrganizationRepository(apiClient);
const accountRepository = new GoChampsAccountRepository(apiClient);
const athleteProfileRepository = new GoChampsAthleteProfileRepository(apiClient);

export const container = {
  getRecentTournaments: new GetRecentTournamentsUseCase(tournamentRepository),
  getTournamentHistory: new GetTournamentHistoryUseCase(tournamentRepository),
  resolvePhaseDestination: new ResolvePhaseDestinationUseCase(),
  getPlayoffOverview: new GetPlayoffOverviewUseCase(tournamentRepository),
  getClassificationOverview: new GetClassificationOverviewUseCase(tournamentRepository),
  getGroupPhaseOverview: new GetGroupPhaseOverviewUseCase(tournamentRepository),
  getOrganizations: new GetOrganizationsUseCase(organizationRepository),
  signIn: new SignInUseCase(accountRepository),
  getAccountProfile: new GetAccountProfileUseCase(accountRepository),
  getAthleteProfileByUsername: new GetAthleteProfileByUsernameUseCase(athleteProfileRepository),
  createAthleteProfile: new CreateAthleteProfileUseCase(athleteProfileRepository),
  updateAthleteProfile: new UpdateAthleteProfileUseCase(athleteProfileRepository),
  getAthleteSchedules: new GetAthleteSchedulesUseCase(athleteProfileRepository),
};
