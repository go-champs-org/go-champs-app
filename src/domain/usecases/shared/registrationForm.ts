import {
  RegistrationAnswers,
  RegistrationCustomField,
  RegistrationInvite,
} from '../../repositories/RegistrationRepository';

/** The invite form as typed. */
export type RegistrationFormValues = {
  name: string;
  shirtNumber: string;
  /** Custom field id to its typed text (DD/MM/AAAA, DD/MM/AAAA HH:mm) or consent. */
  custom: Record<string, string | boolean>;
};

/** `name`, or a custom field's id, to its message. */
export type RegistrationFieldErrors = Record<string, string>;

export type RegistrationWindow = 'open' | 'notStarted' | 'ended';

const REQUIRED = 'Campo obrigatório.';
const NAME_REQUIRED = 'Informe seu nome.';
const FULL_NAME = 'Informe nome e sobrenome.';
const CONSENT_REQUIRED = 'Aceite o documento para continuar.';
const INVALID_DATE = 'Data inválida. Use DD/MM/AAAA.';
const INVALID_DATE_TIME = 'Data e hora inválidas. Use DD/MM/AAAA HH:mm.';

/**
 * Whether the registration takes responses today. Compares calendar days in
 * UTC, inclusive, like the API (`Date.utc_today()` against its start and end).
 */
export const registrationWindow = (
  registration: Pick<RegistrationInvite['registration'], 'startDate' | 'endDate'>,
  now = new Date()
): RegistrationWindow => {
  const today = now.toISOString().slice(0, 10);
  const start = registration.startDate?.slice(0, 10);
  const end = registration.endDate?.slice(0, 10);
  if (start && today < start) return 'notStarted';
  if (end && today > end) return 'ended';
  return 'open';
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Formats digits as they are typed: 21051997 -> 21/05/1997. */
export const maskDate = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/** Formats digits as they are typed: 210519971830 -> 21/05/1997 18:30. */
export const maskDateTime = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 12);
  const date = maskDate(digits.slice(0, 8));
  if (digits.length <= 8) return date;
  const time = digits.slice(8);
  return `${date} ${time.length <= 2 ? time : `${time.slice(0, 2)}:${time.slice(2)}`}`;
};

const realDate = (day: number, month: number, year: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** "21/05/1997" -> "1997-05-21", the CMS date input's value; null when it is not a real date. */
export const parseDate = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  return realDate(day, month, year) ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

/**
 * "21/05/1997 18:30", in the device's time zone, -> the ISO instant the CMS
 * datetime picker sends; null when it is not a real date and time.
 */
export const parseDateTime = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match.map(Number);
  if (!realDate(day, month, year) || hour > 23 || minute > 59) return null;
  return new Date(year, month - 1, day, hour, minute).toISOString();
};

const text = (value: string | boolean | undefined) => (typeof value === 'string' ? value.trim() : '');

const customFieldError = (field: RegistrationCustomField, value: string | boolean | undefined): string | null => {
  if (field.type === 'consent') return field.required && value !== true ? CONSENT_REQUIRED : null;

  const typed = text(value);
  if (!typed) return field.required ? REQUIRED : null;
  if (field.type === 'date' && !parseDate(typed)) return INVALID_DATE;
  if (field.type === 'datetime' && !parseDateTime(typed)) return INVALID_DATE_TIME;
  return null;
};

/** The same rules as the CMS form: a full name, and every required custom field. */
export const validateRegistrationForm = (
  values: RegistrationFormValues,
  fields: RegistrationCustomField[]
): RegistrationFieldErrors => {
  const errors: RegistrationFieldErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = NAME_REQUIRED;
  else if (name.split(/\s+/).length < 2) errors.name = FULL_NAME;

  fields.forEach((field) => {
    const error = customFieldError(field, values.custom[field.id]);
    if (error) errors[field.id] = error;
  });
  return errors;
};

const answerFor = (field: RegistrationCustomField, value: string | boolean | undefined): string | boolean | null => {
  if (field.type === 'consent') return value === true ? true : null;
  const typed = text(value);
  if (!typed) return null;
  if (field.type === 'date') return parseDate(typed);
  if (field.type === 'datetime') return parseDateTime(typed);
  return typed;
};

/**
 * The response the API stores, keyed like the CMS form's (`name`,
 * `shirt_number`, each custom field's id). Blank optional fields are left out.
 * `email` and `username` are the API's to set from the account.
 */
export const toRegistrationAnswers = (
  values: RegistrationFormValues,
  fields: RegistrationCustomField[]
): RegistrationAnswers => {
  const answers: RegistrationAnswers = { name: values.name.trim().replace(/\s+/g, ' ') };
  const shirtNumber = values.shirtNumber.trim();
  if (shirtNumber) answers.shirt_number = shirtNumber;

  fields.forEach((field) => {
    const answer = answerFor(field, values.custom[field.id]);
    if (answer !== null) answers[field.id] = answer;
  });
  return answers;
};
