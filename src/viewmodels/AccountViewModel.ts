import { useCallback, useEffect, useState } from 'react';
import { container } from '../di/container';
import { UserAccountProfile } from '../domain/repositories/AccountRepository';
import { AccountIdentity } from '../domain/repositories/AccountIdentityRepository';
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
import { fieldsFromError, messageFromError, withoutField } from './formErrors';
import { useFlashNotice } from './useFlashNotice';

/** The account screen (menu > Minha conta): account details and identity. */
export const useAccountViewModel = (username: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<UserAccountProfile | null>(null);
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const { notice, showNotice, clearNotice } = useFlashNotice();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<IdentityFormValues>(emptyIdentityForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<IdentityFieldErrors>({});

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setEditing(false);
      if (!username) {
        setAccount(null);
        setIdentity(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [accountProfile, accountIdentity] = await Promise.all([
          container.getAccountProfile.execute(username),
          container.getAccountIdentity.execute(),
        ]);
        if (!mounted) return;
        setAccount(accountProfile);
        setIdentity(accountIdentity);
      } catch (requestError) {
        if (!mounted) return;
        setError(messageFromError(requestError, 'Não foi possível carregar sua conta.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [username, refreshVersion]);

  const resetForm = () => {
    setValues(identityToFormValues(identity));
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

  const setField = (field: IdentityField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((errors) => withoutField(errors, field));
  };

  const save = async () => {
    const errors = validateIdentityForm(values);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSaveError('Confira os campos destacados.');
      return false;
    }

    setSaving(true);
    setSaveError(null);
    setFieldErrors({});
    try {
      const saved = await container.saveAccountIdentity.execute(values, identity);
      setIdentity(saved);
      setEditing(false);
      showNotice('Dados de identidade salvos.');
      return true;
    } catch (requestError) {
      setSaveError(messageFromError(requestError, 'Não foi possível salvar seus dados de identidade.'));
      setFieldErrors(identityFieldErrorsFromApi(fieldsFromError(requestError)));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    error,
    refresh,
    account,
    notice,
    clearNotice,
    identity: {
      data: identity,
      hasData: hasIdentityData(identity),
      editing,
      values,
      saving,
      error: saveError,
      fieldErrors,
      startEdit,
      cancelEdit,
      setField,
      save,
    },
  };
};
