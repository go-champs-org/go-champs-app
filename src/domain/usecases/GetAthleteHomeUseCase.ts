import { AthleteProfile, AthleteProfileRepository, AthleteRecentGame } from '../repositories/AthleteProfileRepository';
import { withProfileLists } from './shared/profileLists';

export type AthleteHome = {
  profile: AthleteProfile | null;
  recentGames: AthleteRecentGame[];
};

/** The Perfil tab: the signed-in athlete's profile, career and latest games. */
export class GetAthleteHomeUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  async execute(username: string): Promise<AthleteHome> {
    const loaded = await withProfileLists(
      this.athleteProfileRepository.getByUsername(username),
      this.athleteProfileRepository.getRecentGames(username)
    );
    if (!loaded) return { profile: null, recentGames: [] };
    return { profile: loaded.profile, recentGames: loaded.lists };
  }
}
