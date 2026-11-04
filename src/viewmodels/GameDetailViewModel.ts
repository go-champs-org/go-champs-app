import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { BASKETBALL_5X5, pollsLiveBoxScore, rankRows, withLiveStats } from '../domain/usecases/shared/boxScore';
import { isLiveGame, livePeriodLabel, LiveScore, showsScore } from '../domain/usecases/shared/liveScore';
import { GameBoxScore, GameOverview } from '../models/GameDetail';
import { useLiveGame } from './LiveScoreViewModel';

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof AppError ? error.message : fallback;

export const useGameDetailViewModel = (gameId: string, apiBaseUrl?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<GameOverview | null>(null);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await container.getGameOverview.execute(gameId, apiBaseUrl);
        if (!mounted) return;
        setOverview(next);
      } catch (requestError) {
        if (!mounted) return;
        setOverview(null);
        setError(messageFromError(requestError, 'Não foi possível carregar o detalhe do jogo.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [apiBaseUrl, gameId, refreshVersion]);

  const game = overview?.game ?? null;
  // One poll feeds the score, the period and the box score, like the public
  // site's live game store.
  const live = useLiveGame(gameId, isLiveGame(game?.live_state), apiBaseUrl);

  const boxScore = useMemo((): GameBoxScore | null => {
    const saved = overview?.boxScore;
    if (!overview || !saved) return null;
    const liveBoxScore = pollsLiveBoxScore(overview.game.live_state, overview.liveSiteUpdate) ? live?.boxScore : null;
    return {
      ...saved,
      home: liveBoxScore
        ? withLiveStats(saved.home, liveBoxScore.home, saved.ranking)
        : { ...saved.home, rows: rankRows(saved.home.rows, saved.ranking) },
      away: liveBoxScore
        ? withLiveStats(saved.away, liveBoxScore.away, saved.ranking)
        : { ...saved.away, rows: rankRows(saved.away.rows, saved.ranking) },
    };
  }, [overview, live]);

  // The scoreboard knows a game ended before the API does.
  const isLive = isLiveGame(game?.live_state) && !live?.ended;
  // A game still to be played carries 0 x 0 as a default, not a result.
  const score: LiveScore | null = game && showsScore(game)
    ? live?.score ?? { homeScore: game.home_score, awayScore: game.away_score }
    : null;
  // Only basketball 5x5 has periods the header can name.
  const periodLabel = isLive && overview?.sportSlug === BASKETBALL_5X5
    ? livePeriodLabel(live?.period ?? null, live?.timeLeft ?? null)
    : null;

  return { loading, error, game, boxScore, isLive, score, periodLabel, refresh };
};
