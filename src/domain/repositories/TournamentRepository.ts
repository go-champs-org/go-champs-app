import { AggregatedPlayerStatsLog, AggregatedPlayerStatsQuery } from '../../models/AggregatedPlayerStats';
import { Game } from '../../models/GameModel';
import { GameDetail, PlayerStatsLog, TeamStatsLog } from '../../models/GameDetail';
import { PhaseData } from '../../models/PhaseModel';
import { StatLeadersGroup } from '../../models/StatLeaders';
import { Tournament } from '../../models/Tournament';
import { TournamentHistory } from '../../models/TournamentHistory';

export interface TournamentRepository {
  getRecentTournaments(): Promise<Tournament[]>;
  getTournamentHistory(id: string, apiBaseUrl?: string): Promise<TournamentHistory>;
  getPhase(phaseId: string, apiBaseUrl?: string): Promise<PhaseData>;
  getGamesByPhaseId(phaseId: string, apiBaseUrl?: string): Promise<Game[]>;
  getStatLeaders(tournamentId: string, statKeys: string[], apiBaseUrl?: string): Promise<StatLeadersGroup[]>;
  getAggregatedPlayerStats(
    tournamentId: string,
    query: AggregatedPlayerStatsQuery,
    apiBaseUrl?: string
  ): Promise<AggregatedPlayerStatsLog[]>;
  getGameById(gameId: string, apiBaseUrl?: string): Promise<GameDetail>;
  getPlayerStatsLogsByGameId(gameId: string, apiBaseUrl?: string): Promise<PlayerStatsLog[]>;
  getTeamStatsLogsByGameId(gameId: string, apiBaseUrl?: string): Promise<TeamStatsLog[]>;
}
