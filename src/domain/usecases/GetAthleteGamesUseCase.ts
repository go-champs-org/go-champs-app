import {
  AthleteProfile,
  AthleteProfileRepository,
  AthleteRecentGame,
  AthleteTeamGame,
} from '../repositories/AthleteProfileRepository';
import { emptyWhenMissing } from './shared/emptyWhenMissing';

export type AthleteGames = {
  profile: AthleteProfile | null;
  teamGames: AthleteTeamGame[];
  recentGames: AthleteRecentGame[];
};

/** Meus jogos: the games of the athlete's teams and their latest results. */
export class GetAthleteGamesUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  async execute(username: string): Promise<AthleteGames> {
    const [profile, teamGames, recentGames] = await Promise.all([
      this.athleteProfileRepository.getByUsername(username),
      emptyWhenMissing(this.athleteProfileRepository.getTeamSchedule(username)),
      emptyWhenMissing(this.athleteProfileRepository.getRecentGames(username)),
    ]);
    if (!profile) return { profile: null, teamGames: [], recentGames: [] };
    return { profile, teamGames, recentGames };
  }
}
