import { AthleteProfile, AthleteProfileRepository, AthleteRecentGame } from '../repositories/AthleteProfileRepository';
import { emptyWhenMissing } from './shared/emptyWhenMissing';

export type AthleteHome = {
  profile: AthleteProfile | null;
  recentGames: AthleteRecentGame[];
};

/** The Perfil tab: the signed-in athlete's profile, career and latest games. */
export class GetAthleteHomeUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  async execute(username: string): Promise<AthleteHome> {
    const [profile, recentGames] = await Promise.all([
      this.athleteProfileRepository.getByUsername(username),
      emptyWhenMissing(this.athleteProfileRepository.getRecentGames(username)),
    ]);
    return { profile, recentGames: profile ? recentGames : [] };
  }
}
