import { useCallback, useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { UserAccountProfile } from '../domain/repositories/AccountRepository';
import { AthleteProfile, AthleteProfileInput } from '../domain/repositories/AthleteProfileRepository';
import { container } from '../di/container';

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const useProfileViewModel = (username: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<UserAccountProfile | null>(null);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [athleteMissing, setAthleteMissing] = useState(false);

  const refresh = useCallback(async () => {
    if (!username) {
      setAccount(null);
      setAthlete(null);
      setAthleteMissing(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [accountProfile, athleteProfile] = await Promise.all([
        container.getAccountProfile.execute(username),
        container.getAthleteProfileByUsername.execute(username),
      ]);
      setAccount(accountProfile);
      setAthlete(athleteProfile);
      setAthleteMissing(athleteProfile === null);
    } catch (requestError) {
      setError(messageFromError(requestError, 'Não foi possível carregar seu perfil.'));
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createAthlete = async (input: AthleteProfileInput) => {
    if (!input.name.trim()) {
      setError('Informe o nome do perfil de atleta.');
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await container.createAthleteProfile.execute({
        ...input,
        name: input.name.trim(),
      });
      setAthlete(created);
      setAthleteMissing(false);
      return true;
    } catch (requestError) {
      setError(messageFromError(requestError, 'Não foi possível criar o perfil de atleta.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateAthlete = async (input: AthleteProfileInput) => {
    if (!username) return false;
    setSaving(true);
    setError(null);
    try {
      const updated = await container.updateAthleteProfile.execute(username, {
        ...input,
        name: input.name.trim(),
      });
      setAthlete(updated);
      return true;
    } catch (requestError) {
      setError(messageFromError(requestError, 'Não foi possível atualizar o perfil de atleta.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    error,
    account,
    athlete,
    athleteMissing,
    refresh,
    createAthlete,
    updateAthlete,
  };
};
