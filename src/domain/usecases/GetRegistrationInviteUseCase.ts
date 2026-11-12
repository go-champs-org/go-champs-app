import { RegistrationInvite, RegistrationRepository } from '../repositories/RegistrationRepository';

export class GetRegistrationInviteUseCase {
  constructor(private readonly registrationRepository: RegistrationRepository) {}

  /** null when the invite does not exist. */
  execute(inviteId: string): Promise<RegistrationInvite | null> {
    return this.registrationRepository.getInvite(inviteId);
  }
}
