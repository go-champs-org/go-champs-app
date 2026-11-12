import { useCallback, useEffect, useState } from 'react';
import { LocalFile } from '../core/http/FileTransport';
import { container } from '../di/container';
import { AthleteProfile } from '../domain/repositories/AthleteProfileRepository';
import {
  AthleteField,
  AthleteFieldErrors,
  athleteFieldErrorsFromApi,
  AthleteFormValues,
  AthletePhotoChange,
  athleteToFormValues,
  validateAthleteForm,
} from '../domain/usecases/shared/athleteProfileForm';
import { fieldsFromError, messageFromError, withoutField } from './formErrors';
import { useFlashNotice } from './useFlashNotice';
import { athleteChanges } from '../core/analytics/athleteChanges';

type Options = {
  // The edit screen opens straight on the form once the profile is loaded.
  editOnLoad?: boolean;
};

/** The signed-in user's athlete profile and its edit form. */
export const useProfileViewModel = (username: string | undefined, { editOnLoad = false }: Options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const { notice, showNotice, clearNotice } = useFlashNotice();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<AthleteFormValues>(() => athleteToFormValues(null));
  const [photo, setPhoto] = useState<AthletePhotoChange>({ kind: 'keep' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AthleteFieldErrors>({});

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setEditing(false);
      if (!username) {
        setAthlete(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const athleteProfile = await container.getAthleteProfileByUsername.execute(username);
        if (!mounted) return;
        setAthlete(athleteProfile);
        if (editOnLoad) {
          setValues(athleteToFormValues(athleteProfile));
          setPhoto({ kind: 'keep' });
          setEditing(true);
        }
      } catch (requestError) {
        if (!mounted) return;
        setError(messageFromError(requestError, 'Não foi possível carregar seu perfil de atleta.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [username, refreshVersion, editOnLoad]);

  const resetForm = () => {
    setValues(athleteToFormValues(athlete));
    setPhoto({ kind: 'keep' });
    setSaveError(null);
    setFieldErrors({});
  };

  const startEdit = () => {
    resetForm();
    clearNotice();
    setEditing(true);
  };

  const cancelEdit = () => {
    resetForm();
    setEditing(false);
  };

  const setField = (field: AthleteField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((errors) => withoutField(errors, field));
  };

  const selectPhoto = (file: LocalFile) => {
    setPhoto({ kind: 'replace', file });
    setFieldErrors((errors) => withoutField(errors, 'photo'));
  };

  const removePhoto = () => {
    setPhoto({ kind: 'remove' });
    setFieldErrors((errors) => withoutField(errors, 'photo'));
  };

  const save = async () => {
    if (!username) return false;
    const errors = validateAthleteForm(values);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSaveError('Confira os campos destacados.');
      return false;
    }

    setSaving(true);
    setSaveError(null);
    setFieldErrors({});
    try {
      const saved = await container.saveAthleteProfile.execute({ username, original: athlete, values, photo });
      setAthlete(saved);
      setPhoto({ kind: 'keep' });
      setEditing(false);
      showNotice(athlete ? 'Perfil de atleta atualizado.' : 'Perfil de atleta criado.');
      return true;
    } catch (requestError) {
      setSaveError(messageFromError(requestError, 'Não foi possível salvar o perfil de atleta.'));
      setFieldErrors(athleteFieldErrorsFromApi(fieldsFromError(requestError)));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const photoUri =
    photo.kind === 'replace' ? photo.file.uri : photo.kind === 'remove' ? null : (athlete?.photo_url ?? null);

  return {
    loading,
    error,
    refresh,
    notice,
    clearNotice,
    athlete: {
      changedFields: athleteChanges(athlete, values, photo),
      data: athlete,
      editing,
      values,
      photoUri,
      saving,
      error: saveError,
      fieldErrors,
      startEdit,
      cancelEdit,
      setField,
      selectPhoto,
      removePhoto,
      save,
    },
  };
};
