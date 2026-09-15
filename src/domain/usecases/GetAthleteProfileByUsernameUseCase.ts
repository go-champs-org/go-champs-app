import { AthleteProfile, AthleteProfileRepository } from '../repositories/AthleteProfileRepository';

export class GetAthleteProfileByUsernameUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  execute(username: string): Promise<AthleteProfile | null> {
    return this.athleteProfileRepository.getByUsername(username);
  }
}
