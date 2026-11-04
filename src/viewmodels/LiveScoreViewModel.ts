import { useEffect, useState } from 'react';
import { container } from '../di/container';
import { hasLiveScoreboard, LIVE_SCORE_POLLING_INTERVAL_MS, LiveScore } from '../domain/usecases/shared/liveScore';

// A live game's running score, polled from the scoreboard like the public
// site does. A game that isn't live never polls; the scoreboard reporting the
// game ended stops the loop, and a failed request keeps the last known score.
export const useLiveScore = (gameId: string, isLive: boolean, initialScore: LiveScore, apiBaseUrl?: string): LiveScore => {
  const [score, setScore] = useState(initialScore);

  useEffect(() => {
    if (!isLive || !hasLiveScoreboard(apiBaseUrl)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const update = await container.getLiveScore.execute(gameId);
        if (!active) return;
        setScore(update.score);
        if (update.ended) return;
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

  return score;
};
