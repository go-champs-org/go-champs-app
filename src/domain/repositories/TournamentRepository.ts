import { ClassificationData } from '../../models/ClassificationModel';
import { Game } from '../../models/GameModel';
import { GroupPhaseData } from '../../models/GroupPhaseModel';
import { PlayoffResponse } from '../../models/PlayoffModel';
import { SportConfig } from '../../models/Sport';
import { Tournament } from '../../models/Tournament';
import { TournamentDetails } from '../../models/TournamentDetails';
import { TournamentHistory } from '../../models/TournamentHistory';

export interface TournamentRepository {
  getRecentTournaments(): Promise<Tournament[]>;
  getTournamentHistory(id: string, apiBaseUrl?: string): Promise<TournamentHistory>;
  getTournamentDetails(tournamentId: string, apiBaseUrl?: string): Promise<TournamentDetails>;
  getPlayoffData(phaseId: string, apiBaseUrl?: string): Promise<PlayoffResponse>;
  getGamesByPhaseId(phaseId: string, apiBaseUrl?: string): Promise<Game[]>;
  getSportConfig(sportSlug: string, apiBaseUrl?: string): Promise<SportConfig>;
  getClassificationData(phaseId: string, apiBaseUrl?: string): Promise<ClassificationData>;
  getGroupPhaseData(phaseId: string, apiBaseUrl?: string): Promise<GroupPhaseData>;
}
