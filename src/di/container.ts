import { FetchHttpClient } from '../core/http/FetchHttpClient';
import { TournamentFallbackDataSource } from '../data/datasources/local/TournamentFallbackDataSource';
import { GoChampsApiClient } from '../data/datasources/remote/GoChampsApiClient';
import { GoChampsOrganizationRepository } from '../data/repositories/GoChampsOrganizationRepository';
import { GoChampsTournamentRepository } from '../data/repositories/GoChampsTournamentRepository';
import { GetClassificationOverviewUseCase } from '../domain/usecases/GetClassificationOverviewUseCase';
import { GetGroupPhaseOverviewUseCase } from '../domain/usecases/GetGroupPhaseOverviewUseCase';
import { GetOrganizationsUseCase } from '../domain/usecases/GetOrganizationsUseCase';
import { GetPlayoffOverviewUseCase } from '../domain/usecases/GetPlayoffOverviewUseCase';
import { GetRecentTournamentsUseCase } from '../domain/usecases/GetRecentTournamentsUseCase';
import { GetTournamentHistoryUseCase } from '../domain/usecases/GetTournamentHistoryUseCase';
import { ResolvePhaseDestinationUseCase } from '../domain/usecases/ResolvePhaseDestinationUseCase';

const httpClient = new FetchHttpClient();
const apiClient = new GoChampsApiClient(httpClient);
const fallbackDataSource = new TournamentFallbackDataSource();

const tournamentRepository = new GoChampsTournamentRepository(apiClient, fallbackDataSource);
const organizationRepository = new GoChampsOrganizationRepository(apiClient);

export const container = {
  getRecentTournaments: new GetRecentTournamentsUseCase(tournamentRepository),
  getTournamentHistory: new GetTournamentHistoryUseCase(tournamentRepository),
  resolvePhaseDestination: new ResolvePhaseDestinationUseCase(),
  getPlayoffOverview: new GetPlayoffOverviewUseCase(tournamentRepository),
  getClassificationOverview: new GetClassificationOverviewUseCase(tournamentRepository),
  getGroupPhaseOverview: new GetGroupPhaseOverviewUseCase(tournamentRepository),
  getOrganizations: new GetOrganizationsUseCase(organizationRepository),
};
