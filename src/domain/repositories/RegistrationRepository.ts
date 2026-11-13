import { AppError } from '../../core/errors/AppError';

/** The custom field types the registration form knows (the CMS's `ApiCustomFieldType`). */
export type RegistrationCustomFieldType = 'text' | 'date' | 'datetime' | 'consent';

export type RegistrationCustomField = {
  id: string;
  type: RegistrationCustomFieldType;
  label: string;
  description: string | null;
  required: boolean;
  /** The document a `consent` field asks the athlete to read. */
  documentUrl: string | null;
};

/** A name with its logo, as the invite's header shows the team, tournament and organization. */
export type RegistrationBrand = {
  name: string;
  logoUrl: string | null;
};

/** A team roster invite (`/Invite/:id`), with the registration it belongs to. */
export type RegistrationInvite = {
  id: string;
  team: RegistrationBrand | null;
  tournament: RegistrationBrand | null;
  organization: RegistrationBrand | null;
  registration: {
    title: string;
    /** ISO dates; null when the registration has no window. */
    startDate: string | null;
    endDate: string | null;
    autoApprove: boolean;
    customFields: RegistrationCustomField[];
  };
};

/** The form's answers as the API stores them: `name`, `shirt_number` and each custom field's id. */
export type RegistrationAnswers = Record<string, string | boolean>;

export type SubmittedRegistrationResponse = {
  id: string;
  status: string;
};

/** Why sending a registration response failed. */
export type RegistrationResponseFailure =
  | 'already_answered'
  | 'closed'
  | 'invalid'
  | 'unavailable'
  | 'session_expired'
  | 'failed';

export class RegistrationResponseError extends AppError {
  constructor(
    readonly reason: RegistrationResponseFailure,
    message: string,
    status?: number
  ) {
    super(message, status);
    this.name = 'RegistrationResponseError';
  }
}

export interface RegistrationRepository {
  /** null when the invite does not exist. */
  getInvite(inviteId: string): Promise<RegistrationInvite | null>;
  /**
   * Answers the invite as the signed-in user; the API ties the response to the
   * account. Rejects with a `RegistrationResponseError`.
   */
  respondToInvite(inviteId: string, answers: RegistrationAnswers): Promise<SubmittedRegistrationResponse>;
}
