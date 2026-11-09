import { AppFieldErrors } from '../../../core/errors/AppError';
import { AccountIdentity, AccountIdentityWrite } from '../../repositories/AccountIdentityRepository';

export type IdentityFormValues = {
  fullLegalName: string;
  /** Typed digits only; blank keeps the stored CPF. */
  taxId: string;
  /** Blank keeps the stored RG. */
  governmentId: string;
  /** DD/MM/AAAA as typed. */
  dateOfBirth: string;
};

export type IdentityField = keyof IdentityFormValues;
export type IdentityFieldErrors = Partial<Record<IdentityField, string>>;

export const emptyIdentityForm: IdentityFormValues = {
  fullLegalName: '',
  taxId: '',
  governmentId: '',
  dateOfBirth: '',
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** "1997-05-21" -> "21/05/1997". */
export const formatBirthDate = (iso: string | null | undefined): string => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

/** "21/05/1997" -> "1997-05-21"; null when it is not a real past date. */
export const parseBirthDate = (value: string, today = new Date()): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal || year < 1900 || date.getTime() > today.getTime()) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

/** Formats digits as they are typed: 21051997 -> 21/05/1997. */
export const maskBirthDate = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/** Formats digits as they are typed: 52998224725 -> 529.982.247-25. */
export const maskCpf = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const cpfCheckDigit = (digits: string, length: number) => {
  const sum = digits
    .slice(0, length)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
};

export const isValidCpf = (value: string): boolean => {
  const digits = digitsOnly(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  return (
    Number(digits[9]) === cpfCheckDigit(digits, 9) && Number(digits[10]) === cpfCheckDigit(digits, 10)
  );
};

/** What the read-only row shows for a stored document. */
export const maskedDocument = (last4: string | null | undefined): string | null =>
  last4 ? `••• •• ${last4}` : null;

export const identityToFormValues = (identity: AccountIdentity | null): IdentityFormValues => ({
  fullLegalName: identity?.full_legal_name ?? '',
  taxId: '',
  governmentId: '',
  dateOfBirth: formatBirthDate(identity?.date_of_birth),
});

export const hasIdentityData = (identity: AccountIdentity | null): identity is AccountIdentity =>
  Boolean(
    identity &&
      (identity.full_legal_name ||
        identity.tax_id_last4 ||
        identity.government_id_last4 ||
        identity.date_of_birth)
  );

export const validateIdentityForm = (values: IdentityFormValues): IdentityFieldErrors => {
  const errors: IdentityFieldErrors = {};
  const words = values.fullLegalName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) errors.fullLegalName = 'Informe nome e sobrenome.';
  if (values.taxId.trim() && !isValidCpf(values.taxId)) errors.taxId = 'CPF inválido.';
  if (values.dateOfBirth.trim() && !parseBirthDate(values.dateOfBirth)) {
    errors.dateOfBirth = 'Data inválida. Use DD/MM/AAAA.';
  }
  return errors;
};

/**
 * Sends only what changed, like the CMS: a document typed in replaces the
 * stored one, a blank document field keeps it.
 */
export const buildIdentityWrite = (
  values: IdentityFormValues,
  original: AccountIdentity | null
): AccountIdentityWrite => {
  const write: AccountIdentityWrite = {};
  const fullLegalName = values.fullLegalName.trim().replace(/\s+/g, ' ');
  if (fullLegalName !== (original?.full_legal_name ?? '')) write.full_legal_name = fullLegalName || null;

  const taxId = digitsOnly(values.taxId);
  if (taxId) {
    write.tax_id_type = 'CPF';
    write.tax_id = taxId;
  }

  const governmentId = values.governmentId.trim();
  if (governmentId) {
    write.government_id_type = 'RG';
    write.government_id = governmentId;
  }

  const dateOfBirth = values.dateOfBirth.trim() ? parseBirthDate(values.dateOfBirth) : null;
  if (dateOfBirth !== (original?.date_of_birth ?? null)) write.date_of_birth = dateOfBirth;

  return write;
};

const API_FIELDS: Record<string, IdentityField> = {
  full_legal_name: 'fullLegalName',
  tax_id: 'taxId',
  tax_id_type: 'taxId',
  government_id: 'governmentId',
  government_id_type: 'governmentId',
  date_of_birth: 'dateOfBirth',
};

/** Puts the API's 422 changeset errors on the form fields. */
export const identityFieldErrorsFromApi = (fields: AppFieldErrors | undefined): IdentityFieldErrors =>
  Object.keys(fields ?? {}).reduce<IdentityFieldErrors>((errors, apiField) => {
    const field = API_FIELDS[apiField];
    return field ? { ...errors, [field]: 'Valor inválido.' } : errors;
  }, {});
