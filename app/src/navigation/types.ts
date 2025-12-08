export type RootStackParamList = {
  TournamentsScreen: undefined;
  TournamentHistoryScreen: { id: string };
  PlayoffsView: { tournamentId: string; phaseId?: string };
  ClassificationView: { phaseId: string; tournamentId?: string };
  GroupPhaseView: { phaseId: string; tournamentId?: string };
  // ...other screens if any...
};
