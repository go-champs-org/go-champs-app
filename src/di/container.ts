import { MutableTokenProvider } from '../core/auth/MutableTokenProvider';
import { ExpoImageSharer } from '../core/share/ExpoImageSharer';
import { ImageSharer } from '../core/share/ImageSharer';
import { FetchFileTransport } from '../core/http/FetchFileTransport';
import { FetchHttpClient } from '../core/http/FetchHttpClient';
import { PinnedTournamentsLocalStore } from '../data/datasources/local/PinnedTournamentsLocalStore';
import { TournamentFallbackDataSource } from '../data/datasources/local/TournamentFallbackDataSource';
import { GoChampsApiClient } from '../data/datasources/remote/GoChampsApiClient';
import { GoChampsAccountIdentityRepository } from '../data/repositories/GoChampsAccountIdentityRepository';
import { GoChampsAccountRepository } from '../data/repositories/GoChampsAccountRepository';
import { GoChampsAthleteProfileRepository } from '../data/repositories/GoChampsAthleteProfileRepository';
import { GoChampsMediaUploadRepository } from '../data/repositories/GoChampsMediaUploadRepository';
import { GoChampsScoreboardRepository } from '../data/repositories/GoChampsScoreboardRepository';
import { GoChampsOrganizationRepository } from '../data/repositories/GoChampsOrganizationRepository';
import { GoChampsTournamentRepository } from '../data/repositories/GoChampsTournamentRepository';
import { LocalPinnedTournamentsRepository } from '../data/repositories/LocalPinnedTournamentsRepository';
import { DeleteAccountUseCase } from '../domain/usecases/DeleteAccountUseCase';
import { GetAccountIdentityUseCase } from '../domain/usecases/GetAccountIdentityUseCase';
import { GetAccountProfileUseCase } from '../domain/usecases/GetAccountProfileUseCase';
import { GetAthleteOverviewUseCase } from '../domain/usecases/GetAthleteOverviewUseCase';
import { GetAthleteProfileByUsernameUseCase } from '../domain/usecases/GetAthleteProfileByUsernameUseCase';
import { GetAthleteGamesUseCase } from '../domain/usecases/GetAthleteGamesUseCase';
import { GetAthleteHomeUseCase } from '../domain/usecases/GetAthleteHomeUseCase';
import { GetGameOverviewUseCase } from '../domain/usecases/GetGameOverviewUseCase';
import { GetLiveScoreUseCase } from '../domain/usecases/GetLiveScoreUseCase';
import { GetOrganizationOverviewUseCase } from '../domain/usecases/GetOrganizationOverviewUseCase';
import { GetPhaseOverviewUseCase } from '../domain/usecases/GetPhaseOverviewUseCase';
import { GetPinnedTournamentIdsUseCase } from '../domain/usecases/GetPinnedTournamentIdsUseCase';
import { GetOrganizationDirectoryUseCase } from '../domain/usecases/GetOrganizationDirectoryUseCase';
import { ResolveGoChampsLinkUseCase } from '../domain/usecases/ResolveGoChampsLinkUseCase';
import { GetRegistrationInviteUseCase } from '../domain/usecases/GetRegistrationInviteUseCase';
import { RespondToRegistrationInviteUseCase } from '../domain/usecases/RespondToRegistrationInviteUseCase';
import { GoChampsRegistrationRepository } from '../data/repositories/GoChampsRegistrationRepository';
import { SaveAccountIdentityUseCase } from '../domain/usecases/SaveAccountIdentityUseCase';
import { SaveAthleteProfileUseCase } from '../domain/usecases/SaveAthleteProfileUseCase';
import { SearchTournamentsUseCase } from '../domain/usecases/SearchTournamentsUseCase';
import { GetRecentTournamentsUseCase } from '../domain/usecases/GetRecentTournamentsUseCase';
import { GetStatLeadersUseCase } from '../domain/usecases/GetStatLeadersUseCase';
import { GetTournamentOverviewUseCase } from '../domain/usecases/GetTournamentOverviewUseCase';
import { GetTeamOverviewUseCase } from '../domain/usecases/GetTeamOverviewUseCase';
import { GetTournamentStatsUseCase } from '../domain/usecases/GetTournamentStatsUseCase';
import { SignInUseCase } from '../domain/usecases/SignInUseCase';
import { TogglePinnedTournamentUseCase } from '../domain/usecases/TogglePinnedTournamentUseCase';

const httpClient = new FetchHttpClient();
export const tokenProvider = new MutableTokenProvider();
const apiClient = new GoChampsApiClient(httpClient, tokenProvider);
const fallbackDataSource = new TournamentFallbackDataSource();
const pinnedTournamentsStore = new PinnedTournamentsLocalStore();

const tournamentRepository = new GoChampsTournamentRepository(apiClient, fallbackDataSource);
const organizationRepository = new GoChampsOrganizationRepository(apiClient);
const accountRepository = new GoChampsAccountRepository(apiClient);
const athleteProfileRepository = new GoChampsAthleteProfileRepository(apiClient);
const accountIdentityRepository = new GoChampsAccountIdentityRepository(apiClient);
const registrationRepository = new GoChampsRegistrationRepository(apiClient);
const mediaUploadRepository = new GoChampsMediaUploadRepository(apiClient, new FetchFileTransport());
const scoreboardRepository = new GoChampsScoreboardRepository(httpClient);
const pinnedTournamentsRepository = new LocalPinnedTournamentsRepository(pinnedTournamentsStore);

export const container = {
  getRecentTournaments: new GetRecentTournamentsUseCase(tournamentRepository),
  searchTournaments: new SearchTournamentsUseCase(tournamentRepository),
  getOrganizationDirectory: new GetOrganizationDirectoryUseCase(organizationRepository),
  getTournamentOverview: new GetTournamentOverviewUseCase(tournamentRepository),
  getLiveScore: new GetLiveScoreUseCase(scoreboardRepository),
  getPhaseOverview: new GetPhaseOverviewUseCase(tournamentRepository),
  getStatLeaders: new GetStatLeadersUseCase(tournamentRepository),
  getTournamentStats: new GetTournamentStatsUseCase(tournamentRepository),
  getGameOverview: new GetGameOverviewUseCase(tournamentRepository),
  getTeamOverview: new GetTeamOverviewUseCase(tournamentRepository),
  getAthleteOverview: new GetAthleteOverviewUseCase(tournamentRepository),
  getOrganizationOverview: new GetOrganizationOverviewUseCase(organizationRepository),
  resolveGoChampsLink: new ResolveGoChampsLinkUseCase(tournamentRepository),
  getRegistrationInvite: new GetRegistrationInviteUseCase(registrationRepository),
  respondToRegistrationInvite: new RespondToRegistrationInviteUseCase(registrationRepository),
  signIn: new SignInUseCase(accountRepository),
  getAccountProfile: new GetAccountProfileUseCase(accountRepository),
  deleteAccount: new DeleteAccountUseCase(accountRepository),
  getAthleteProfileByUsername: new GetAthleteProfileByUsernameUseCase(athleteProfileRepository),
  saveAthleteProfile: new SaveAthleteProfileUseCase(athleteProfileRepository, mediaUploadRepository),
  getAccountIdentity: new GetAccountIdentityUseCase(accountIdentityRepository),
  saveAccountIdentity: new SaveAccountIdentityUseCase(accountIdentityRepository),
  getAthleteHome: new GetAthleteHomeUseCase(athleteProfileRepository),
  getAthleteGames: new GetAthleteGamesUseCase(athleteProfileRepository),
  getPinnedTournamentIds: new GetPinnedTournamentIdsUseCase(pinnedTournamentsRepository),
  togglePinnedTournament: new TogglePinnedTournamentUseCase(pinnedTournamentsRepository),
  imageSharer: new ExpoImageSharer() as ImageSharer,
};
