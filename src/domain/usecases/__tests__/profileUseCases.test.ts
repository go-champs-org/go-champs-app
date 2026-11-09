import { AccountIdentity, AccountIdentityRepository } from '../../repositories/AccountIdentityRepository';
import { AthleteProfile, AthleteProfileRepository } from '../../repositories/AthleteProfileRepository';
import { MediaUploadRepository } from '../../repositories/MediaUploadRepository';
import { GetAccountIdentityUseCase } from '../GetAccountIdentityUseCase';
import { SaveAccountIdentityUseCase } from '../SaveAccountIdentityUseCase';
import { SaveAthleteProfileUseCase } from '../SaveAthleteProfileUseCase';

const identity: AccountIdentity = {
  id: 'i1',
  full_legal_name: 'Ana Silva',
  tax_id_type: 'CPF',
  tax_id_last4: '4725',
  government_id_type: null,
  government_id_last4: null,
  date_of_birth: '1997-05-21',
};

const identityRepository = () =>
  ({
    get: jest.fn().mockResolvedValue(identity),
    create: jest.fn().mockResolvedValue(identity),
    update: jest.fn().mockResolvedValue(identity),
  }) as jest.Mocked<AccountIdentityRepository>;

const values = { fullLegalName: 'Ana Silva', taxId: '', governmentId: '', dateOfBirth: '21/05/1997' };

describe('account identity use cases', () => {
  it('loads the identity', async () => {
    const repository = identityRepository();
    await expect(new GetAccountIdentityUseCase(repository).execute()).resolves.toEqual(identity);
  });

  it('updates with only the changed fields when the identity exists', async () => {
    const repository = identityRepository();
    await new SaveAccountIdentityUseCase(repository).execute({ ...values, governmentId: '12.345.678-9' }, identity);
    expect(repository.update).toHaveBeenCalledWith({ government_id_type: 'RG', government_id: '12.345.678-9' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates when there is no identity yet', async () => {
    const repository = identityRepository();
    await new SaveAccountIdentityUseCase(repository).execute({ ...values, taxId: '52998224725' }, null);
    expect(repository.create).toHaveBeenCalledWith({
      full_legal_name: 'Ana Silva',
      tax_id_type: 'CPF',
      tax_id: '52998224725',
      date_of_birth: '1997-05-21',
    });
  });

  it('sends nothing when nothing changed', async () => {
    const repository = identityRepository();
    await expect(new SaveAccountIdentityUseCase(repository).execute(values, identity)).resolves.toBe(identity);
    await expect(
      new SaveAccountIdentityUseCase(repository).execute(
        { fullLegalName: '', taxId: '', governmentId: '', dateOfBirth: '' },
        null
      )
    ).resolves.toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});

const athlete: AthleteProfile = {
  id: 'a1',
  username: 'ana',
  name: 'Ana',
  photo_url: 'https://cdn/old.png',
  facebook: null,
  instagram: null,
  twitter: null,
};

const athleteSetup = () => {
  const athleteRepository = {
    getByUsername: jest.fn(),
    create: jest.fn().mockResolvedValue(athlete),
    updateByUsername: jest.fn().mockResolvedValue(athlete),
    getMySchedules: jest.fn(),
  } as jest.Mocked<AthleteProfileRepository>;
  const uploadRepository = { upload: jest.fn().mockResolvedValue('https://cdn/new.jpg') } as jest.Mocked<MediaUploadRepository>;
  return { athleteRepository, uploadRepository, useCase: new SaveAthleteProfileUseCase(athleteRepository, uploadRepository) };
};

const athleteValues = { name: ' Ana ', facebook: '', instagram: ' @ana ', twitter: '' };
const file = { uri: 'file:///p.jpg', mimeType: 'image/jpeg', fileName: 'p.jpg' };

describe('SaveAthleteProfileUseCase', () => {
  it('keeps the stored photo and patches the whole profile', async () => {
    const { athleteRepository, uploadRepository, useCase } = athleteSetup();
    await useCase.execute({ username: 'ana', original: athlete, values: athleteValues, photo: { kind: 'keep' } });
    expect(uploadRepository.upload).not.toHaveBeenCalled();
    expect(athleteRepository.updateByUsername).toHaveBeenCalledWith('ana', {
      name: 'Ana',
      photo_url: 'https://cdn/old.png',
      facebook: null,
      instagram: '@ana',
      twitter: null,
    });
  });

  it('uploads a new photo first and saves its public URL', async () => {
    const { athleteRepository, uploadRepository, useCase } = athleteSetup();
    await useCase.execute({ username: 'ana', original: athlete, values: athleteValues, photo: { kind: 'replace', file } });
    expect(uploadRepository.upload).toHaveBeenCalledWith(file, 'athlete-profiles-photos');
    expect(athleteRepository.updateByUsername).toHaveBeenCalledWith(
      'ana',
      expect.objectContaining({ photo_url: 'https://cdn/new.jpg' })
    );
  });

  it('does not save the profile when the upload fails', async () => {
    const { athleteRepository, uploadRepository, useCase } = athleteSetup();
    uploadRepository.upload.mockRejectedValue(new Error('upload'));
    await expect(
      useCase.execute({ username: 'ana', original: athlete, values: athleteValues, photo: { kind: 'replace', file } })
    ).rejects.toThrow('upload');
    expect(athleteRepository.updateByUsername).not.toHaveBeenCalled();
  });

  it('clears the photo and creates when there is no profile', async () => {
    const { athleteRepository, useCase } = athleteSetup();
    await useCase.execute({ username: 'ana', original: null, values: athleteValues, photo: { kind: 'remove' } });
    expect(athleteRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana', photo_url: null }));
  });

  it('creates without a photo when none is picked', async () => {
    const { athleteRepository, useCase } = athleteSetup();
    await useCase.execute({ username: 'ana', original: null, values: athleteValues, photo: { kind: 'keep' } });
    expect(athleteRepository.create).toHaveBeenCalledWith(expect.objectContaining({ photo_url: null }));
  });
});
