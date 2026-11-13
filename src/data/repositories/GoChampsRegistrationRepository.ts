import { AppError } from '../../core/errors/AppError';
import { GoChampsApiClient } from '../datasources/remote/GoChampsApiClient';
import {
  RegistrationAnswers,
  RegistrationBrand,
  RegistrationCustomField,
  RegistrationCustomFieldType,
  RegistrationInvite,
  RegistrationRepository,
  RegistrationResponseError,
  SubmittedRegistrationResponse,
} from '../../domain/repositories/RegistrationRepository';

type ApiCustomField = {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  required?: boolean | null;
  properties?: { public_url?: string | null } | null;
};

type ApiBrand = { name?: string | null; logo_url?: string | null } | null;

type ApiRegistrationInvite = {
  id: string;
  invitee?: ApiBrand;
  registration?: {
    title: string;
    start_date?: string | null;
    end_date?: string | null;
    auto_approve?: boolean | null;
    custom_fields?: ApiCustomField[] | null;
    tournament?: (ApiBrand & { organization?: ApiBrand }) | null;
  } | null;
};

type ApiRegistrationResponse = { id: string; status: string };

const FIELD_TYPES: RegistrationCustomFieldType[] = ['text', 'date', 'datetime', 'consent'];

const ALREADY_ANSWERED = 'Você já se inscreveu neste time.';
const NOT_OPEN_YET = 'As inscrições para este time ainda não abriram.';
const CLOSED = 'As inscrições para este time foram encerradas.';
const INVALID = 'Confira os campos obrigatórios.';
const UNAVAILABLE = 'Este convite não está mais disponível.';
const SESSION_EXPIRED = 'Sessão expirada. Entre novamente para enviar sua inscrição.';
const FAILED = 'Não foi possível enviar sua inscrição. Tente novamente.';

const toCustomField = (field: ApiCustomField): RegistrationCustomField | null => {
  const type = field.type?.toLowerCase() as RegistrationCustomFieldType;
  // The CMS form skips a type it does not know; so does the app.
  if (!FIELD_TYPES.includes(type)) return null;
  return {
    id: field.id,
    type,
    label: field.label,
    description: field.description || null,
    required: !!field.required,
    documentUrl: field.properties?.public_url || null,
  };
};

const toBrand = (brand: ApiBrand | undefined): RegistrationBrand | null =>
  brand?.name ? { name: brand.name, logoUrl: brand.logo_url || null } : null;

const toInvite = (invite: ApiRegistrationInvite): RegistrationInvite => ({
  id: invite.id,
  team: toBrand(invite.invitee),
  tournament: toBrand(invite.registration?.tournament),
  organization: toBrand(invite.registration?.tournament?.organization),
  registration: {
    title: invite.registration?.title ?? '',
    startDate: invite.registration?.start_date ?? null,
    endDate: invite.registration?.end_date ?? null,
    autoApprove: !!invite.registration?.auto_approve,
    customFields: (invite.registration?.custom_fields ?? [])
      .map(toCustomField)
      .filter((field): field is RegistrationCustomField => field !== null),
  },
});

/** The API's changeset errors, in the athlete's words. */
const failureFor = (error: AppError): RegistrationResponseError => {
  const status = error.status;
  if (status === 401 || status === 403) return new RegistrationResponseError('session_expired', SESSION_EXPIRED, status);
  if (status === 404) return new RegistrationResponseError('unavailable', UNAVAILABLE, status);
  if (status !== 422) return new RegistrationResponseError('failed', FAILED, status);

  const responseErrors = error.fields?.response ?? [];
  const inviteErrors = error.fields?.registration_invite_id ?? [];
  if (responseErrors.includes('email already exists')) {
    return new RegistrationResponseError('already_answered', ALREADY_ANSWERED, status);
  }
  if (inviteErrors.includes('registration is not active yet')) {
    return new RegistrationResponseError('closed', NOT_OPEN_YET, status);
  }
  if (inviteErrors.includes('registration is not active anymore')) {
    return new RegistrationResponseError('closed', CLOSED, status);
  }
  if (inviteErrors.length) return new RegistrationResponseError('unavailable', UNAVAILABLE, status);
  return new RegistrationResponseError('invalid', INVALID, status);
};

export class GoChampsRegistrationRepository implements RegistrationRepository {
  constructor(private readonly apiClient: GoChampsApiClient) {}

  async getInvite(inviteId: string): Promise<RegistrationInvite | null> {
    try {
      const response = await this.apiClient.get<{ data: ApiRegistrationInvite }>(
        `/registration-invites/${encodeURIComponent(inviteId)}?include=registration,registration.tournament,registration.tournament.organization`
      );
      return toInvite(response.data);
    } catch (error) {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    }
  }

  async respondToInvite(inviteId: string, answers: RegistrationAnswers): Promise<SubmittedRegistrationResponse> {
    try {
      const response = await this.apiClient.post<{ data: ApiRegistrationResponse }>(
        `/registration-invites/${encodeURIComponent(inviteId)}/responses`,
        { registration_response: { response: answers } }
      );
      return { id: response.data.id, status: response.data.status };
    } catch (error) {
      if (error instanceof AppError) throw failureFor(error);
      throw new RegistrationResponseError('failed', FAILED);
    }
  }
}
