import { WebAuthPurpose } from '../webauth/WebAuthPurpose';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  TournamentsScreen: undefined;
  TournamentScreen: { tournamentId: string; phaseId?: string; apiBaseUrl?: string };
  TournamentStatsScreen: { tournamentId: string; statKey?: string; apiBaseUrl?: string };
  GameDetailScreen: { gameId: string; apiBaseUrl?: string };
  TeamScreen: { tournamentId: string; teamId: string; apiBaseUrl?: string };
  AuthScreen: { initialMode?: 'signIn' | 'signUp' | 'recovery' };
  WebAuthFlowScreen: { purpose: WebAuthPurpose };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyGamesTab: undefined;
  ProfileTab: undefined;
};
