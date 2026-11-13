import {
  RegistrationInvite,
  RegistrationRepository,
  SubmittedRegistrationResponse,
} from '../repositories/RegistrationRepository';
import {
  RegistrationFieldErrors,
  RegistrationFormValues,
  toRegistrationAnswers,
  validateRegistrationForm,
} from './shared/registrationForm';

export type RespondToRegistrationInviteResult =
  | { kind: 'invalid'; fieldErrors: RegistrationFieldErrors }
  | { kind: 'submitted'; response: SubmittedRegistrationResponse };

export class RespondToRegistrationInviteUseCase {
  constructor(private readonly registrationRepository: RegistrationRepository) {}

  /**
   * Validates the form and sends it as the signed-in athlete's response.
   * A rejected send is the repository's `RegistrationResponseError`.
   */
  async execute(invite: RegistrationInvite, values: RegistrationFormValues): Promise<RespondToRegistrationInviteResult> {
    const fields = invite.registration.customFields;
    const fieldErrors = validateRegistrationForm(values, fields);
    if (Object.keys(fieldErrors).length) return { kind: 'invalid', fieldErrors };

    const response = await this.registrationRepository.respondToInvite(invite.id, toRegistrationAnswers(values, fields));
    return { kind: 'submitted', response };
  }
}
