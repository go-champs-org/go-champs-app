import { AthleteProfile, AthleteProfileInput, AthleteProfileRepository } from '../repositories/AthleteProfileRepository';

export class UpdateAthleteProfileUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  execute(username: string, input: AthleteProfileInput): Promise<AthleteProfile> {
    return this.athleteProfileRepository.updateByUsername(username, input);
  }
}
