import { useCallback, useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { LocalFile } from '../core/http/FileTransport';
import { container } from '../di/container';
import { UserAccountProfile } from '../domain/repositories/AccountRepository';
import { AccountIdentity } from '../domain/repositories/AccountIdentityRepository';
import { AthleteProfile } from '../domain/repositories/AthleteProfileRepository';
import {
  emptyIdentityForm,
  hasIdentityData,
  IdentityField,
  IdentityFieldErrors,
  IdentityFormValues,
  identityFieldErrorsFromApi,
  identityToFormValues,
  validateIdentityForm,
} from '../domain/usecases/shared/accountIdentityForm';
import {
  AthleteField,
  AthleteFieldErrors,
  athleteFieldErrorsFromApi,
  AthleteFormValues,
  AthletePhotoChange,
  athleteToFormValues,
  validateAthleteForm,
} from '../domain/usecases/shared/athleteProfileForm';

const CHECK_FIELDS = 'Confira os campos destacados.';

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

const fieldsFromError = (error: unknown) => (error instanceof AppError ? error.fields : undefined);

const withoutField = <E extends object>(errors: E, field: keyof E): E => {
  if (!(field in errors)) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
};

export const useProfileViewModel = (username: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<UserAccountProfile | null>(null);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [identityEditing, setIdentityEditing] = useState(false);
  const [identityValues, setIdentityValues] = useState<IdentityFormValues>(emptyIdentityForm);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identityFieldErrors, setIdentityFieldErrors] = useState<IdentityFieldErrors>({});

  const [athleteEditing, setAthleteEditing] = useState(false);
  const [athleteValues, setAthleteValues] = useState<AthleteFormValues>(() => athleteToFormValues(null));
  const [athletePhoto, setAthletePhoto] = useState<AthletePhotoChange>({ kind: 'keep' });
  const [athleteSaving, setAthleteSaving] = useState(false);
  const [athleteError, setAthleteError] = useState<string | null>(null);
  const [athleteFieldErrors, setAthleteFieldErrors] = useState<AthleteFieldErrors>({});

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIdentityEditing(false);
      setAthleteEditing(false);
      setNotice(null);
      if (!username) {
        setAccount(null);
        setAthlete(null);
        setIdentity(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [accountProfile, athleteProfile, accountIdentity] = await Promise.all([
          container.getAccountProfile.execute(username),
          container.getAthleteProfileByUsername.execute(username),
          container.getAccountIdentity.execute(),
        ]);
        if (!mounted) return;
        setAccount(accountProfile);
        setAthlete(athleteProfile);
        setIdentity(accountIdentity);
      } catch (requestError) {
        if (!mounted) return;
        setError(messageFromError(requestError, 'Não foi possível carregar seu perfil.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [username, refreshVersion]);

  const startIdentityEdit = () => {
    setIdentityValues(identityToFormValues(identity));
    setIdentityError(null);
    setIdentityFieldErrors({});
    setNotice(null);
    setIdentityEditing(true);
  };

  const cancelIdentityEdit = () => {
    setIdentityValues(identityToFormValues(identity));
    setIdentityError(null);
    setIdentityFieldErrors({});
    setIdentityEditing(false);
  };

  const setIdentityField = (field: IdentityField, value: string) => {
    setIdentityValues((values) => ({ ...values, [field]: value }));
    setIdentityFieldErrors((errors) => withoutField(errors, field));
  };

  const saveIdentity = async () => {
    const errors = validateIdentityForm(identityValues);
    if (Object.keys(errors).length) {
      setIdentityFieldErrors(errors);
      setIdentityError(CHECK_FIELDS);
      return false;
    }

    setIdentitySaving(true);
    setIdentityError(null);
    setIdentityFieldErrors({});
    try {
      const saved = await container.saveAccountIdentity.execute(identityValues, identity);
      setIdentity(saved);
      setIdentityEditing(false);
      setNotice('Dados de identidade salvos.');
      return true;
    } catch (requestError) {
      setIdentityError(messageFromError(requestError, 'Não foi possível salvar seus dados de identidade.'));
      setIdentityFieldErrors(identityFieldErrorsFromApi(fieldsFromError(requestError)));
      return false;
    } finally {
      setIdentitySaving(false);
    }
  };

  const startAthleteEdit = () => {
    setAthleteValues(athleteToFormValues(athlete));
    setAthletePhoto({ kind: 'keep' });
    setAthleteError(null);
    setAthleteFieldErrors({});
    setNotice(null);
    setAthleteEditing(true);
  };

  const cancelAthleteEdit = () => {
    setAthleteValues(athleteToFormValues(athlete));
    setAthletePhoto({ kind: 'keep' });
    setAthleteError(null);
    setAthleteFieldErrors({});
    setAthleteEditing(false);
  };

  const setAthleteField = (field: AthleteField, value: string) => {
    setAthleteValues((values) => ({ ...values, [field]: value }));
    setAthleteFieldErrors((errors) => withoutField(errors, field));
  };

  const selectAthletePhoto = (file: LocalFile) => {
    setAthletePhoto({ kind: 'replace', file });
    setAthleteFieldErrors((errors) => withoutField(errors, 'photo'));
  };

  const removeAthletePhoto = () => {
    setAthletePhoto({ kind: 'remove' });
    setAthleteFieldErrors((errors) => withoutField(errors, 'photo'));
  };

  const saveAthlete = async () => {
    if (!username) return false;
    const errors = validateAthleteForm(athleteValues);
    if (Object.keys(errors).length) {
      setAthleteFieldErrors(errors);
      setAthleteError(CHECK_FIELDS);
      return false;
    }

    setAthleteSaving(true);
    setAthleteError(null);
    setAthleteFieldErrors({});
    try {
      const saved = await container.saveAthleteProfile.execute({
        username,
        original: athlete,
        values: athleteValues,
        photo: athletePhoto,
      });
      setAthlete(saved);
      setAthletePhoto({ kind: 'keep' });
      setAthleteEditing(false);
      setNotice(athlete ? 'Perfil de atleta atualizado.' : 'Perfil de atleta criado.');
      return true;
    } catch (requestError) {
      setAthleteError(messageFromError(requestError, 'Não foi possível salvar o perfil de atleta.'));
      setAthleteFieldErrors(athleteFieldErrorsFromApi(fieldsFromError(requestError)));
      return false;
    } finally {
      setAthleteSaving(false);
    }
  };

  const athletePhotoUri =
    athletePhoto.kind === 'replace'
      ? athletePhoto.file.uri
      : athletePhoto.kind === 'remove'
        ? null
        : (athlete?.photo_url ?? null);

  return {
    loading,
    error,
    refresh,
    account,
    notice,
    identity: {
      data: identity,
      hasData: hasIdentityData(identity),
      editing: identityEditing,
      values: identityValues,
      saving: identitySaving,
      error: identityError,
      fieldErrors: identityFieldErrors,
      startEdit: startIdentityEdit,
      cancelEdit: cancelIdentityEdit,
      setField: setIdentityField,
      save: saveIdentity,
    },
    athlete: {
      data: athlete,
      editing: athleteEditing,
      values: athleteValues,
      photoUri: athletePhotoUri,
      saving: athleteSaving,
      error: athleteError,
      fieldErrors: athleteFieldErrors,
      startEdit: startAthleteEdit,
      cancelEdit: cancelAthleteEdit,
      setField: setAthleteField,
      selectPhoto: selectAthletePhoto,
      removePhoto: removeAthletePhoto,
      save: saveAthlete,
    },
  };
};
