import { useCallback, useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { BoxScoreTeamSection, GameDetail } from '../models/GameDetail';

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const useGameDetailViewModel = (gameId: string, apiBaseUrl?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [boxScore, setBoxScore] = useState<BoxScoreTeamSection[]>([]);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const overview = await container.getGameOverview.execute(gameId, apiBaseUrl);
        if (!mounted) return;
        setGame(overview.game);
        setBoxScore(overview.boxScore);
      } catch (requestError) {
        if (!mounted) return;
        setGame(null);
        setBoxScore([]);
        setError(messageFromError(requestError, 'Não foi possível carregar o detalhe do jogo.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [apiBaseUrl, gameId, refreshVersion]);

  return { loading, error, game, boxScore, refresh };
};
