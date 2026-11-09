import {
  buildIdentityWrite,
  formatBirthDate,
  hasIdentityData,
  identityFieldErrorsFromApi,
  identityToFormValues,
  isValidCpf,
  maskBirthDate,
  maskCpf,
  maskedDocument,
  parseBirthDate,
  validateIdentityForm,
} from '../accountIdentityForm';
import { AccountIdentity } from '../../../repositories/AccountIdentityRepository';

const identity: AccountIdentity = {
  id: 'i1',
  full_legal_name: 'Ana Silva',
  tax_id_type: 'CPF',
  tax_id_last4: '4725',
  government_id_type: 'RG',
  government_id_last4: '6789',
  date_of_birth: '1997-05-21',
};

const today = new Date('2026-11-09T12:00:00Z');

describe('accountIdentityForm', () => {
  it('formats and parses birth dates', () => {
    expect(formatBirthDate('1997-05-21')).toBe('21/05/1997');
    expect(formatBirthDate(null)).toBe('');
    expect(parseBirthDate('21/05/1997', today)).toBe('1997-05-21');
    expect(parseBirthDate('31/02/1997', today)).toBeNull();
    expect(parseBirthDate('21/05/2030', today)).toBeNull();
    expect(parseBirthDate('01/01/1800', today)).toBeNull();
    expect(parseBirthDate('1997-05-21', today)).toBeNull();
    expect(parseBirthDate('21/05/1997')).toBe('1997-05-21');
  });

  it('masks dates and CPF as they are typed', () => {
    expect(maskBirthDate('2')).toBe('2');
    expect(maskBirthDate('2105')).toBe('21/05');
    expect(maskBirthDate('21051997123')).toBe('21/05/1997');
    expect(maskCpf('529')).toBe('529');
    expect(maskCpf('5299822')).toBe('529.982.2');
    expect(maskCpf('52998224725')).toBe('529.982.247-25');
  });

  it('checks CPF digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
    expect(isValidCpf('00000000191')).toBe(true);
  });

  it('masks stored documents', () => {
    expect(maskedDocument('4725')).toBe('••• •• 4725');
    expect(maskedDocument(null)).toBeNull();
  });

  it('maps identities to form values', () => {
    expect(identityToFormValues(identity)).toEqual({
      fullLegalName: 'Ana Silva',
      taxId: '',
      governmentId: '',
      dateOfBirth: '21/05/1997',
    });
    expect(identityToFormValues(null)).toEqual({ fullLegalName: '', taxId: '', governmentId: '', dateOfBirth: '' });
  });

  it('tells whether an identity has any data', () => {
    expect(hasIdentityData(identity)).toBe(true);
    expect(hasIdentityData(null)).toBe(false);
    expect(
      hasIdentityData({
        ...identity,
        full_legal_name: null,
        tax_id_last4: null,
        government_id_last4: null,
        date_of_birth: null,
      })
    ).toBe(false);
  });

  it('validates the form', () => {
    expect(validateIdentityForm({ fullLegalName: '', taxId: '', governmentId: '', dateOfBirth: '' })).toEqual({});
    expect(
      validateIdentityForm({ fullLegalName: 'Ana', taxId: '123', governmentId: 'x', dateOfBirth: '99/99/9999' })
    ).toEqual({
      fullLegalName: 'Informe nome e sobrenome.',
      taxId: 'CPF inválido.',
      dateOfBirth: 'Data inválida. Use DD/MM/AAAA.',
    });
  });

  it('writes only the changed fields', () => {
    const unchanged = identityToFormValues(identity);
    expect(buildIdentityWrite(unchanged, identity)).toEqual({});
    expect(
      buildIdentityWrite(
        { fullLegalName: '  Ana   Souza ', taxId: '529.982.247-25', governmentId: ' 12.345 ', dateOfBirth: '' },
        identity
      )
    ).toEqual({
      full_legal_name: 'Ana Souza',
      tax_id_type: 'CPF',
      tax_id: '52998224725',
      government_id_type: 'RG',
      government_id: '12.345',
      date_of_birth: null,
    });
    expect(buildIdentityWrite({ ...unchanged, fullLegalName: '' }, identity)).toEqual({ full_legal_name: null });
  });

  it('maps API field errors to form fields', () => {
    expect(identityFieldErrorsFromApi({ tax_id: ['x'], date_of_birth: ['y'], account_id: ['z'] })).toEqual({
      taxId: 'Valor inválido.',
      dateOfBirth: 'Valor inválido.',
    });
    expect(identityFieldErrorsFromApi(undefined)).toEqual({});
  });
});
