import { RegistrationCustomField } from '../../../repositories/RegistrationRepository';
import {
  formatDate,
  formatDateTime,
  toPickerDate,
  maskDate,
  maskDateTime,
  parseDate,
  parseDateTime,
  registrationWindow,
  toRegistrationAnswers,
  validateRegistrationForm,
} from '../registrationForm';

const field = (overrides: Partial<RegistrationCustomField>): RegistrationCustomField => ({
  id: 'f',
  type: 'text',
  label: 'Campo',
  description: null,
  required: false,
  documentUrl: null,
  ...overrides,
});

const fields = [
  field({ id: 'position', type: 'text', required: true }),
  field({ id: 'birth', type: 'date', required: true }),
  field({ id: 'arrival', type: 'datetime' }),
  field({ id: 'terms', type: 'consent', required: true }),
  field({ id: 'nickname', type: 'text' }),
  field({ id: 'photoTerms', type: 'consent' }),
];

describe('registrationWindow', () => {
  const now = new Date('2026-11-12T23:30:00Z');

  it.each([
    [{ startDate: null, endDate: null }, 'open'],
    [{ startDate: '2026-11-12T00:00:00Z', endDate: '2026-11-12T00:00:00Z' }, 'open'],
    [{ startDate: '2026-11-13T00:00:00Z', endDate: null }, 'notStarted'],
    [{ startDate: null, endDate: '2026-11-11T23:59:59Z' }, 'ended'],
    [{ startDate: '2026-11-01', endDate: '2026-11-30' }, 'open'],
  ])('reads %p as %s, by UTC day like the API', (registration, expected) => {
    expect(registrationWindow(registration, now)).toBe(expected);
  });

  it('uses today by default', () => {
    expect(registrationWindow({ startDate: null, endDate: null })).toBe('open');
  });
});

describe('masks', () => {
  it.each([
    ['', ''],
    ['2', '2'],
    ['2105', '21/05'],
    ['21/05/1997', '21/05/1997'],
    ['2105199712', '21/05/1997'],
  ])('masks the date %p as %p', (typed, expected) => {
    expect(maskDate(typed)).toBe(expected);
  });

  it.each([
    ['21051997', '21/05/1997'],
    ['210519971', '21/05/1997 1'],
    ['2105199718', '21/05/1997 18'],
    ['210519971830', '21/05/1997 18:30'],
    ['21/05/1997 18:309', '21/05/1997 18:30'],
  ])('masks the date and time %p as %p', (typed, expected) => {
    expect(maskDateTime(typed)).toBe(expected);
  });
});

describe('parsers', () => {
  it.each([
    ['21/05/1997', '1997-05-21'],
    [' 29/02/2024 ', '2024-02-29'],
    ['29/02/2023', null],
    ['31/04/2026', null],
    ['2026-05-21', null],
  ])('parses the date %p as %p', (typed, expected) => {
    expect(parseDate(typed)).toBe(expected);
  });

  it('parses the date and time in the device time zone', () => {
    expect(parseDateTime('21/05/1997 18:30')).toBe(new Date(1997, 4, 21, 18, 30).toISOString());
  });

  it.each(['21/05/1997', '21/05/1997 24:00', '21/05/1997 18:60', '31/02/1997 10:00'])(
    'rejects the date and time %p',
    (typed) => {
      expect(parseDateTime(typed)).toBeNull();
    }
  );
});

describe('picker dates', () => {
  it('shows a picked day and moment in the field format', () => {
    expect(formatDate(new Date(1997, 4, 1, 8, 5))).toBe('01/05/1997');
    expect(formatDateTime(new Date(1997, 4, 1, 8, 5))).toBe('01/05/1997 08:05');
  });

  it('reads the field back as the moment for the picker to start on', () => {
    expect(toPickerDate('21/05/1997')).toEqual(new Date(1997, 4, 21));
    expect(toPickerDate(' 21/05/1997 18:30 ')).toEqual(new Date(1997, 4, 21, 18, 30));
  });

  it.each(['', '21/05', '31/02/1997', '21/05/1997 24:00', '21/05/1997 18:60', '1997-05-21'])(
    'has no moment for %p',
    (value) => expect(toPickerDate(value)).toBeNull()
  );
});

describe('validateRegistrationForm', () => {
  const valid = {
    name: 'Ana Silva',
    shirtNumber: '',
    custom: { position: 'Ala', birth: '21/05/2010', terms: true },
  };

  it('accepts a full name and every required field', () => {
    expect(validateRegistrationForm(valid, fields)).toEqual({});
  });

  it('asks for the name, and for a full one', () => {
    expect(validateRegistrationForm({ ...valid, name: '  ' }, fields)).toEqual({ name: 'Informe seu nome.' });
    expect(validateRegistrationForm({ ...valid, name: 'Ana' }, fields)).toEqual({ name: 'Informe nome e sobrenome.' });
  });

  it('blocks empty required fields and an unaccepted consent', () => {
    expect(validateRegistrationForm({ ...valid, custom: { position: ' ', terms: false } }, fields)).toEqual({
      position: 'Campo obrigatório.',
      birth: 'Campo obrigatório.',
      terms: 'Aceite o documento para continuar.',
    });
  });

  it('checks the dates typed, required or not', () => {
    expect(
      validateRegistrationForm({ ...valid, custom: { ...valid.custom, birth: '31/02/2010', arrival: '21/05/2026' } }, fields)
    ).toEqual({
      birth: 'Data inválida. Use DD/MM/AAAA.',
      arrival: 'Data e hora inválidas. Use DD/MM/AAAA HH:mm.',
    });
  });
});

describe('toRegistrationAnswers', () => {
  it('keys the answers like the CMS form and leaves blank optional fields out', () => {
    expect(
      toRegistrationAnswers(
        {
          name: '  Ana   Silva ',
          shirtNumber: ' 10 ',
          custom: {
            position: ' Ala ',
            birth: '21/05/2010',
            arrival: '20/11/2026 18:30',
            terms: true,
            nickname: '  ',
            photoTerms: false,
          },
        },
        fields
      )
    ).toEqual({
      name: 'Ana Silva',
      shirt_number: '10',
      position: 'Ala',
      birth: '2010-05-21',
      arrival: new Date(2026, 10, 20, 18, 30).toISOString(),
      terms: true,
    });
  });

  it('sends only the name when nothing else is filled', () => {
    expect(toRegistrationAnswers({ name: 'Ana Silva', shirtNumber: '', custom: {} }, fields)).toEqual({
      name: 'Ana Silva',
    });
  });
});
