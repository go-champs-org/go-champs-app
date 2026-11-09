import { AthleteProfile, AthleteProfileRepository } from '../repositories/AthleteProfileRepository';
import { MediaUploadRepository } from '../repositories/MediaUploadRepository';
import { AthleteFormValues, AthletePhotoChange, buildAthleteInput } from './shared/athleteProfileForm';

export type SaveAthleteProfileRequest = {
  username: string;
  original: AthleteProfile | null;
  values: AthleteFormValues;
  photo: AthletePhotoChange;
};

export class SaveAthleteProfileUseCase {
  constructor(
    private readonly athleteProfileRepository: AthleteProfileRepository,
    private readonly mediaUploadRepository: MediaUploadRepository
  ) {}

  /**
   * Uploads a new photo first (presigned URL, like the CMS), then sends the
   * whole profile in one request: PATCH when it exists, POST otherwise.
   */
  async execute({ username, original, values, photo }: SaveAthleteProfileRequest): Promise<AthleteProfile> {
    const photoUrl = await this.resolvePhotoUrl(original, photo);
    const input = buildAthleteInput(values, photoUrl);
    return original
      ? this.athleteProfileRepository.updateByUsername(username, input)
      : this.athleteProfileRepository.create(input);
  }

  private resolvePhotoUrl(original: AthleteProfile | null, photo: AthletePhotoChange): Promise<string | null> {
    if (photo.kind === 'replace') {
      return this.mediaUploadRepository.upload(photo.file, 'athlete-profiles-photos');
    }
    return Promise.resolve(photo.kind === 'remove' ? null : (original?.photo_url ?? null));
  }
}
