import { WebAuthPurpose } from '../webauth/WebAuthPurpose';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  TournamentsScreen: undefined;
  TournamentScreen: { tournamentId: string; phaseId?: string; apiBaseUrl?: string };
  TournamentStatsScreen: { tournamentId: string; statKey?: string; apiBaseUrl?: string };
  GameDetailScreen: { gameId: string; apiBaseUrl?: string };
  TeamScreen: { tournamentId: string; teamId: string; apiBaseUrl?: string };
  AthleteScreen: { tournamentId: string; playerId: string; apiBaseUrl?: string };
  OrganizationScreen: { organizationSlug: string; apiBaseUrl?: string };
  OrganizationsScreen: undefined;
  AccountScreen: undefined;
  AthleteProfileEditScreen: undefined;
  AuthScreen: { initialMode?: 'signIn' | 'signUp' | 'recovery' };
  WebAuthFlowScreen: { purpose: WebAuthPurpose };
  // A go-champs.com link the app was opened with, resolved to its screen.
  GoChampsLinkScreen: { path: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyGamesTab: undefined;
  // Back from the edit screen with what was saved.
  ProfileTab: { savedNotice?: string } | undefined;
};
