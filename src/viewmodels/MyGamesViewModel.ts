import { useCallback, useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { ScheduleGame } from '../domain/repositories/AthleteProfileRepository';
import { container } from '../di/container';

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const useMyGamesViewModel = (isAuthenticated: boolean) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [needsAthleteProfile, setNeedsAthleteProfile] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setGames([]);
      setNeedsAthleteProfile(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsAthleteProfile(false);

    try {
      const nextGames = await container.getAthleteSchedules.execute();
      setGames(nextGames);
    } catch (requestError) {
      const message = messageFromError(requestError, 'Não foi possível carregar sua agenda.');
      if (requestError instanceof AppError && requestError.status === 401) {
        setNeedsAthleteProfile(true);
        setGames([]);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    error,
    games,
    needsAuth: !isAuthenticated,
    needsAthleteProfile,
    refresh,
  };
};
