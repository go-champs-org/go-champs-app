import { AthleteProfile, AthleteProfileInput, AthleteProfileRepository } from '../repositories/AthleteProfileRepository';

export class CreateAthleteProfileUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  execute(input: AthleteProfileInput): Promise<AthleteProfile> {
    return this.athleteProfileRepository.create(input);
  }
}
