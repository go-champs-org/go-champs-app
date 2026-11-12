import { AthleteProfile } from '../../domain/repositories/AthleteProfileRepository';
import { AthleteFormValues, AthletePhotoChange, buildAthleteInput } from '../../domain/usecases/shared/athleteProfileForm';
import { ATHLETE_FIELDS, AthleteChangedField } from './events';

export function athleteChanges(original: AthleteProfile | null, values: AthleteFormValues, photo: AthletePhotoChange): AthleteChangedField[] {
  const next = buildAthleteInput(values, original?.photo_url ?? null);
  return ATHLETE_FIELDS.filter((field) => field === 'photo_url'
    ? photo.kind === 'replace' || (photo.kind === 'remove' && Boolean(original?.photo_url))
    : next[field] !== (original?.[field] ?? null));
}
