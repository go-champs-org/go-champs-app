import { AthleteProfileRepository, ScheduleGame } from '../repositories/AthleteProfileRepository';

export class GetAthleteSchedulesUseCase {
  constructor(private readonly athleteProfileRepository: AthleteProfileRepository) {}

  execute(): Promise<ScheduleGame[]> {
    return this.athleteProfileRepository.getMySchedules();
  }
}
