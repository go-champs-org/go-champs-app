export type RootStackParamList = {
  MainTabs: undefined;
  TournamentsScreen: undefined;
  TournamentHistoryScreen: { id: string; apiBaseUrl?: string };
  PlayoffsView: { tournamentId: string; phaseId?: string; apiBaseUrl?: string };
  ClassificationView: { phaseId: string; tournamentId?: string; apiBaseUrl?: string };
  GroupPhaseView: { phaseId: string; tournamentId?: string; apiBaseUrl?: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MyGamesTab: undefined;
  ProfileTab: undefined;
};
