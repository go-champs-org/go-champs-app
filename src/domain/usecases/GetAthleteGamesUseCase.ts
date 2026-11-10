import {
  AthleteProfile,
  AthleteProfileRepository,
  AthleteRecentGame,
  AthleteTeamGame,
} from '../repositories/AthleteProfileRepository';
import { withProfileLists } from './shared/profileLists';

export type AthleteGames = {
  profile: AthleteProfile | null;
  teamGames: AthleteTeamGame[];
  recentGames: AthleteRecentGame[];
};

/** Meus jogos: the games of the athlete's teams and their latest results. */
export class GetAthleteGamesUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  async execute(username: string): Promise<AthleteGames> {
    const loaded = await withProfileLists(
      this.athleteProfileRepository.getByUsername(username),
      Promise.all([
        this.athleteProfileRepository.getTeamSchedule(username),
        this.athleteProfileRepository.getRecentGames(username),
      ])
    );
    if (!loaded) return { profile: null, teamGames: [], recentGames: [] };
    const [teamGames, recentGames] = loaded.lists;
    return { profile: loaded.profile, teamGames, recentGames };
  }
}
