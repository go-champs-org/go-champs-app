import { AppFieldErrors } from '../../../core/errors/AppError';
import { LocalFile } from '../../../core/http/FileTransport';
import { AthleteProfile, AthleteProfileInput } from '../../repositories/AthleteProfileRepository';

export type AthleteFormValues = {
  name: string;
  facebook: string;
  instagram: string;
  twitter: string;
};

export type AthleteField = keyof AthleteFormValues;
export type AthleteFieldErrors = Partial<Record<AthleteField | 'photo', string>>;

/** What happens to the photo on save. */
export type AthletePhotoChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'replace'; file: LocalFile };

export const athleteToFormValues = (athlete: AthleteProfile | null): AthleteFormValues => ({
  name: athlete?.name ?? '',
  facebook: athlete?.facebook ?? '',
  instagram: athlete?.instagram ?? '',
  twitter: athlete?.twitter ?? '',
});

export const validateAthleteForm = (values: AthleteFormValues): AthleteFieldErrors =>
  values.name.trim() ? {} : { name: 'Informe o nome de atleta.' };

const optional = (value: string) => value.trim() || null;

/** The CMS sends every field on create and update; so does the app. */
export const buildAthleteInput = (values: AthleteFormValues, photoUrl: string | null): AthleteProfileInput => ({
  name: values.name.trim(),
  photo_url: photoUrl,
  facebook: optional(values.facebook),
  instagram: optional(values.instagram),
  twitter: optional(values.twitter),
});

const API_FIELDS: Record<string, AthleteField | 'photo'> = {
  name: 'name',
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
  photo_url: 'photo',
};

const API_MESSAGES: Partial<Record<AthleteField | 'photo', string>> = {
  facebook: 'Use o usuário ou o link do Facebook.',
  instagram: 'Use @usuario ou o link do Instagram.',
  twitter: 'Use @usuario ou o link do Twitter/X.',
};

export const athleteFieldErrorsFromApi = (fields: AppFieldErrors | undefined): AthleteFieldErrors =>
  Object.keys(fields ?? {}).reduce<AthleteFieldErrors>((errors, apiField) => {
    const field = API_FIELDS[apiField];
    return field ? { ...errors, [field]: API_MESSAGES[field] ?? 'Valor inválido.' } : errors;
  }, {});

type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

/** Turns an image picker asset into the file the upload needs. */
export const localFileFromPicked = ({ uri, mimeType, fileName }: PickedImage): LocalFile => {
  const isPng = mimeType === 'image/png' || (!mimeType && /\.png$/i.test(fileName || uri));
  const type = mimeType || (isPng ? 'image/png' : 'image/jpeg');
  return { uri, mimeType: type, fileName: fileName || `foto-atleta.${type === 'image/png' ? 'png' : 'jpg'}` };
};
