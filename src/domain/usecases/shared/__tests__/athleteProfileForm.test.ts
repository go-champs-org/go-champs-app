import {
  athleteFieldErrorsFromApi,
  athleteToFormValues,
  buildAthleteInput,
  localFileFromPicked,
  validateAthleteForm,
} from '../athleteProfileForm';

describe('athleteProfileForm', () => {
  it('maps a profile to form values', () => {
    expect(
      athleteToFormValues({
        id: 'a1',
        username: 'ana',
        name: 'Ana',
        photo_url: null,
        facebook: 'ana.fb',
        instagram: null,
        twitter: '@ana',
      })
    ).toEqual({ name: 'Ana', facebook: 'ana.fb', instagram: '', twitter: '@ana' });
    expect(athleteToFormValues(null)).toEqual({ name: '', facebook: '', instagram: '', twitter: '' });
  });

  it('requires a name', () => {
    expect(validateAthleteForm({ name: ' ', facebook: '', instagram: '', twitter: '' })).toEqual({
      name: 'Informe o nome de atleta.',
    });
    expect(validateAthleteForm({ name: 'Ana', facebook: '', instagram: '', twitter: '' })).toEqual({});
  });

  it('builds the input with trimmed values and nulls for blanks', () => {
    expect(buildAthleteInput({ name: ' Ana ', facebook: ' ', instagram: '@ana ', twitter: '' }, 'https://p')).toEqual({
      name: 'Ana',
      photo_url: 'https://p',
      facebook: null,
      instagram: '@ana',
      twitter: null,
    });
  });

  it('maps API field errors', () => {
    expect(
      athleteFieldErrorsFromApi({ facebook: ['x'], twitter: ['x'], name: ['x'], photo_url: ['x'], other: ['x'] })
    ).toEqual({
      facebook: 'Use o usuário ou o link do Facebook.',
      twitter: 'Use @usuario ou o link do Twitter/X.',
      name: 'Valor inválido.',
      photo: 'Valor inválido.',
    });
    expect(athleteFieldErrorsFromApi(undefined)).toEqual({});
  });

  it('turns picker assets into upload files', () => {
    expect(localFileFromPicked({ uri: 'file:///a.jpg', mimeType: 'image/jpeg', fileName: 'a.jpg' })).toEqual({
      uri: 'file:///a.jpg',
      mimeType: 'image/jpeg',
      fileName: 'a.jpg',
    });
    expect(localFileFromPicked({ uri: 'file:///b.PNG' })).toEqual({
      uri: 'file:///b.PNG',
      mimeType: 'image/png',
      fileName: 'foto-atleta.png',
    });
    expect(localFileFromPicked({ uri: 'file:///c', mimeType: null, fileName: null })).toEqual({
      uri: 'file:///c',
      mimeType: 'image/jpeg',
      fileName: 'foto-atleta.jpg',
    });
  });
});
