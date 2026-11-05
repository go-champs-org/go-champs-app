import { useEffect, useState } from 'react';
import { container } from '../di/container';
import {
  hasLiveScoreboard,
  LIVE_SCORE_POLLING_INTERVAL_MS,
  LiveScore,
  LiveScoreUpdate,
} from '../domain/usecases/shared/liveScore';

// A live game's scoreboard feed, polled like the public site's live game
// store: one request in flight, re-armed every 10s. A game that isn't live
// never polls; the scoreboard reporting the game ended stops the loop, and a
// failed request keeps the last update. Null until the first response lands.
export const useLiveGame = (gameId: string, isLive: boolean, apiBaseUrl?: string): LiveScoreUpdate | null => {
  // Keyed by the game, so a screen reused for another game never shows the
  // previous one's feed.
  const [latest, setLatest] = useState<{ gameId: string; update: LiveScoreUpdate } | null>(null);

  useEffect(() => {
    if (!isLive || !hasLiveScoreboard(apiBaseUrl)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await container.getLiveScore.execute(gameId);
        if (!active) return;
        setLatest({ gameId, update: next });
        if (next.ended) return;
      } catch {
        if (!active) return;
      }
      timer = setTimeout(poll, LIVE_SCORE_POLLING_INTERVAL_MS);
    };
    void poll();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [gameId, isLive, apiBaseUrl]);

  return latest?.gameId === gameId ? latest.update : null;
};

// Just the running score, for a card that shows nothing else of the feed.
export const useLiveScore = (gameId: string, isLive: boolean, initialScore: LiveScore, apiBaseUrl?: string): LiveScore =>
  useLiveGame(gameId, isLive, apiBaseUrl)?.score ?? initialScore;
