import { API_CONFIG } from '../../../core/config/apiConfig';
import { ScoreboardGameResponse, ScoreboardTeam } from '../../../models/ScoreboardGame';

// Same cadence the public site and the CMS poll the scoreboard at.
export const LIVE_SCORE_POLLING_INTERVAL_MS = 10000;

const IN_PROGRESS = 'in_progress';

export type LiveScore = { homeScore: number; awayScore: number };

export type LiveScoreUpdate = { score: LiveScore; ended: boolean };

export const isLiveGame = (liveState: string | null | undefined): boolean => liveState === IN_PROGRESS;

// A game still to be played carries 0 x 0 as a default, not a result, so it
// shows no score; one that ended or is running does.
export const showsScore = (game: { is_finished: boolean; live_state: string | null | undefined }): boolean =>
  game.is_finished || isLiveGame(game.live_state);

// Only production tournaments have a scoreboard the app knows; a staging one
// keeps the score the API reports.
export const hasLiveScoreboard = (apiBaseUrl?: string): boolean =>
  !apiBaseUrl || apiBaseUrl === API_CONFIG.goChampsBaseUrl;

const teamPoints = (team: ScoreboardTeam): number => team.total_player_stats?.points || 0;

// The scoreboard knows a game ended before the API does. A response without
// the field keeps polling on, so an older scoreboard never freezes a score.
export const toLiveScoreUpdate = (response: ScoreboardGameResponse): LiveScoreUpdate => {
  const state = response.data.live_state?.state;
  return {
    score: { homeScore: teamPoints(response.data.home_team), awayScore: teamPoints(response.data.away_team) },
    ended: state !== undefined && !isLiveGame(state),
  };
};
