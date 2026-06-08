import { Draw } from '../../models/PlayoffModel';
import { Game } from '../../models/GameModel';
import { TournamentRepository } from '../repositories/TournamentRepository';
import { buildTeamMap, sortGamesByDate, TeamMap } from './shared/phasePresentation';

export type PlayoffOverview = {
  draws: Draw[];
  games: Game[];
  teamMap: TeamMap;
};

export class GetPlayoffOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(tournamentId: string, apiBaseUrl?: string, selectedPhaseId?: string): Promise<PlayoffOverview> {
    const tournament = await this.tournamentRepository.getTournamentDetails(tournamentId, apiBaseUrl);
    const playoffsPhase =
      tournament.phases.find((phase) => (phase.title || '').toLowerCase() === 'playoffs') ||
      tournament.phases.find((phase) => (phase.type || '').toLowerCase() === 'draw') ||
      tournament.phases[0];

    const phaseId = selectedPhaseId ?? playoffsPhase?.id ?? tournamentId;
    const [playoffData, gamesResponse] = await Promise.all([
      this.tournamentRepository.getPlayoffData(phaseId, apiBaseUrl),
      this.tournamentRepository.getGamesByPhaseId(phaseId, apiBaseUrl),
    ]);

    if (tournament.sport_slug) {
      this.tournamentRepository.getSportConfig(tournament.sport_slug, apiBaseUrl).catch(() => undefined);
    }

    const games = sortGamesByDate(gamesResponse);

    return {
      draws: [...(playoffData.data?.draws ?? [])].sort((a, b) => a.order - b.order),
      games,
      teamMap: buildTeamMap(games, undefined, { includeLogos: true }),
    };
  }
}
