import { AggregatedPlayerStatsLog } from '../../../models/AggregatedPlayerStats';
import { BoxScoreRow } from '../../../models/GameDetail';
import { Game } from '../../../models/GameModel';
import { Coach, Player } from '../../../models/TournamentHistory';
import { formatDayKeyLong, gameDateKey } from './gameDateTime';
import { PER_GAME_SUFFIX } from './statLeaders';
import { baseStatSlug } from './tournamentStats';

// The team page mirrors the public site's
// (apps/public/app/[locale]/[org]/[tournament]/team/[teamId]): the roster with
// its season numbers, the coaching staff, and the team's games by day.

export type GameSide = 'home' | 'away';

// A walkover is awarded, not played: the result type names the winner and the
// score says nothing.
const WALKOVER_WINNER: Record<string, GameSide> = {
  home_team_walkover: 'home',
  away_team_walkover: 'away',
};

type ScoredGame = Pick<Game, 'home_score' | 'away_score' | 'is_finished' | 'result_type'>;

// Which side won, or undefined while the game is undecided — still to be
// played, in progress, or drawn. A game in progress already carries a score;
// it only counts once the organizer closes it.
export const gameWinner = (game: ScoredGame): GameSide | undefined => {
  const awarded = WALKOVER_WINNER[game.result_type || ''];
  if (awarded) return awarded;
  if (!game.is_finished || game.home_score === game.away_score) return undefined;
  return game.home_score > game.away_score ? 'home' : 'away';
};

export type SideEmphasis = 'winner' | 'loser' | 'neutral';

// The winner leads the row, the side it beat steps back, and an undecided
// game leaves both as they are.
export const sideEmphasis = (winner: GameSide | undefined, side: GameSide): SideEmphasis => {
  if (!winner) return 'neutral';
  return winner === side ? 'winner' : 'loser';
};

// Shirt numbers are free text and plenty of rosters leave them blank:
// numbered athletes first in numeric order, the rest after them by name, the
// way a printed roster reads.
const shirtOrder = (shirtNumber: string | null): number => {
  const parsed = Number.parseInt(shirtNumber ?? '', 10);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const byShirtNumberThenName = (left: Player, right: Player): number => {
  const leftOrder = shirtOrder(left.shirt_number);
  const rightOrder = shirtOrder(right.shirt_number);
  if (leftOrder === rightOrder) return left.name.localeCompare(right.name, 'pt-BR');
  return leftOrder < rightOrder ? -1 : 1;
};

// Every statistic reads as a string, the way the box score reads them, so the
// same sort and cells serve both tables. A stat not recorded stays absent.
const statStrings = (stats: AggregatedPlayerStatsLog['stats'] | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries(stats || {})
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  );

// The roster is what the table lists, not the stats endpoint: an athlete who
// has not played yet still belongs on the team's page, with a dash in every
// column. The API has no players-by-team endpoint; the tournament carries them.
export const teamRosterRows = (players: Player[], teamId: string, logs: AggregatedPlayerStatsLog[]): BoxScoreRow[] => {
  const statsByPlayer = new Map(logs.map((log) => [log.player_id, log.stats]));
  return players
    .filter((player) => player.team_id === teamId)
    .sort(byShirtNumberThenName)
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      number: player.shirt_number || undefined,
      photoUrl: player.photo_url || undefined,
      stats: statStrings(statsByPlayer.get(player.id)),
    }));
};

// Games played and started count per athlete: twelve athletes with five games
// each is not a team that played sixty.
const PER_ATHLETE_COUNTS = new Set(['game_played', 'game_started']);

// Only counts add up: a percentage of the team is not the sum of its column,
// and neither is a per-game average.
const isSummable = (key: string): boolean =>
  !key.endsWith(PER_GAME_SUFFIX) && !baseStatSlug(key).endsWith('_percentage') && !PER_ATHLETE_COUNTS.has(key);

// The totals band, keyed by stat. A column no athlete has a number for stays
// out, reading as a dash rather than a team that scored none of it. Minutes
// stay in seconds, for the cell to read them like any other minutes.
export const rosterTotals = (rows: BoxScoreRow[], keys: string[]): Record<string, string> =>
  Object.fromEntries(
    keys.filter(isSummable).flatMap((key) => {
      const values = rows.map((row) => Number(row.stats[key])).filter((value) => Number.isFinite(value));
      return values.length > 0 ? [[key, String(values.reduce((sum, value) => sum + value, 0))]] : [];
    })
  );

export type LabelledCoach = { id: string; name: string; label: string };

const COACH_LABELS: Record<string, string> = {
  head_coach: 'Treinador principal',
  assistant_coach: 'Assistente',
};

// An unknown type stays unlabelled rather than leaking the raw slug.
export const labelCoaches = (coaches: Coach[] | null | undefined): LabelledCoach[] =>
  (coaches ?? []).map((coach) => ({ id: coach.id, name: coach.name, label: COACH_LABELS[coach.type || ''] || '' }));

export type GameDay = {
  // Sortable calendar day ('2026-08-12'); empty for a game with no date.
  key: string;
  label: string;
  games: Game[];
};

// The team's games by the day they are played, newest day first — a visitor
// opening a team mid-tournament looks for the last result, not the opening
// round — and each day in kickoff order. A game with no date yet comes last,
// under no heading.
export const teamGameDays = (games: Game[]): GameDay[] => {
  const days = new Map<string, Game[]>();
  [...games]
    .sort((left, right) => (left.datetime || '').localeCompare(right.datetime || ''))
    .forEach((game) => {
      const key = gameDateKey(game.datetime || '');
      days.set(key, [...(days.get(key) ?? []), game]);
    });

  return [...days.keys()]
    .sort()
    .reverse()
    .map((key) => ({ key, label: key ? formatDayKeyLong(key) : '', games: days.get(key) as Game[] }));
};
