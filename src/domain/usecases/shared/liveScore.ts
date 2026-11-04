import { API_CONFIG } from '../../../core/config/apiConfig';
import { BoxScoreRow, BoxScoreTeamStats } from '../../../models/GameDetail';
import { ScoreboardGameResponse, ScoreboardTeam } from '../../../models/ScoreboardGame';

// Same cadence the public site and the CMS poll the scoreboard at.
export const LIVE_SCORE_POLLING_INTERVAL_MS = 10000;

const IN_PROGRESS = 'in_progress';

export type LiveScore = { homeScore: number; awayScore: number };

// Basketball 5x5 plays four quarters and numbers every period after them on
// from 5; each of those is an overtime, counted within its type.
export type LivePeriod = { type: 'quarter' | 'overtime'; number: number };

// One scoreboard response, everything the app reads off it: the score, whether
// the game ended, the clock, and both sides' live box score.
export type LiveScoreUpdate = {
  score: LiveScore;
  ended: boolean;
  period: LivePeriod | null;
  timeLeft: string | null;
  boxScore: { home: BoxScoreTeamStats; away: BoxScoreTeamStats };
};

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

const BASKETBALL_QUARTERS = 4;

// Null until the scoreboard reports a period, so a game not yet tipped off
// shows no period rather than a made-up one.
export const scoreboardBasketballPeriod = (response: ScoreboardGameResponse): LivePeriod | null => {
  const period = response.data.clock_state?.period;
  if (!period || period < 1) return null;
  return period <= BASKETBALL_QUARTERS
    ? { type: 'quarter', number: period }
    : { type: 'overtime', number: period - BASKETBALL_QUARTERS };
};

// The time left in the period as the scoreboard clock shows it, "07:32".
export const scoreboardPeriodTimeLeft = (response: ScoreboardGameResponse): string | null => {
  const time = response.data.clock_state?.time;
  if (typeof time !== 'number' || time < 0) return null;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// "2º quarto · 07:32", "1ª prorrogação"; null when there is no period to name.
export const livePeriodLabel = (period: LivePeriod | null, timeLeft: string | null): string | null => {
  if (!period) return null;
  const name = period.type === 'quarter' ? `${period.number}º quarto` : `${period.number}ª prorrogação`;
  return timeLeft ? `${name} · ${timeLeft}` : name;
};

// Every statistic the scoreboard reports arrives as a number; the box score
// reads every statistic as a string, live or saved alike.
const stringifyStats = (stats: Record<string, number> | null | undefined): Record<string, string> =>
  Object.fromEntries(Object.entries(stats || {}).map(([slug, value]) => [slug, String(value)]));

const teamRows = (team: ScoreboardTeam): BoxScoreRow[] =>
  (team.players || []).map((player) => ({
    playerId: player.id,
    name: player.name,
    number: player.number || undefined,
    stats: stringifyStats(player.stats_values),
  }));

const teamBoxScore = (team: ScoreboardTeam): BoxScoreTeamStats => ({
  rows: teamRows(team),
  totals: stringifyStats(team.total_player_stats),
});

// The scoreboard knows a game ended before the API does. A response without
// the field keeps polling on, so an older scoreboard never freezes a score.
export const toLiveScoreUpdate = (response: ScoreboardGameResponse): LiveScoreUpdate => {
  const state = response.data.live_state?.state;
  return {
    score: { homeScore: teamPoints(response.data.home_team), awayScore: teamPoints(response.data.away_team) },
    ended: state !== undefined && !isLiveGame(state),
    period: scoreboardBasketballPeriod(response),
    timeLeft: scoreboardPeriodTimeLeft(response),
    boxScore: { home: teamBoxScore(response.data.home_team), away: teamBoxScore(response.data.away_team) },
  };
};
