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

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
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
        if (!mounted) return;
        setGames(nextGames);
      } catch (requestError) {
        if (!mounted) return;
        const message = messageFromError(requestError, 'Não foi possível carregar sua agenda.');
        if (requestError instanceof AppError && requestError.status === 401) {
          setNeedsAthleteProfile(true);
          setGames([]);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [isAuthenticated, refreshVersion]);

  return {
    loading,
    error,
    games,
    needsAuth: !isAuthenticated,
    needsAthleteProfile,
    refresh,
  };
};
