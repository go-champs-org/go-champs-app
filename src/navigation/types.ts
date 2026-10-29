import { WebAuthPurpose } from '../webauth/WebAuthPurpose';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  TournamentsScreen: undefined;
  TournamentHistoryScreen: { id: string; apiBaseUrl?: string };
  PlayoffsView: { tournamentId: string; phaseId?: string; apiBaseUrl?: string };
  ClassificationView: { phaseId: string; tournamentId?: string; apiBaseUrl?: string };
  GroupPhaseView: { phaseId: string; tournamentId?: string; apiBaseUrl?: string };
  GameDetailScreen: { gameId: string; apiBaseUrl?: string };
  AuthScreen: { initialMode?: 'signIn' | 'signUp' | 'recovery' };
  WebAuthFlowScreen: { purpose: WebAuthPurpose };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyGamesTab: undefined;
  ProfileTab: undefined;
};
