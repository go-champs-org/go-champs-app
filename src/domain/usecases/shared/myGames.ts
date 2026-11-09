import {
  AthleteMembership,
  AthleteProfile,
  AthleteRecentGame,
  AthleteTeamGame,
  ScheduleTeam,
} from '../../repositories/AthleteProfileRepository';
import { gameDateKey, localDateKey } from './gameDateTime';
import { formatStatValue } from './tournamentStats';

// Meus jogos (Figma 1143:12192): the next game of the athlete's teams, the
// other upcoming ones and the latest results. The filters only narrow the
// games already loaded; they never ask the API again.

export type MyGamesView = 'all' | 'upcoming';

export type MyGamesFilter = {
  view: MyGamesView;
  // null reads every tournament.
  tournamentId: string | null;
};

export const DEFAULT_MY_GAMES_FILTER: MyGamesFilter = { view: 'all', tournamentId: null };

export type MyGamesData = {
  teamGames: AthleteTeamGame[];
  recentGames: AthleteRecentGame[];
};

export type MyGamesSections = {
  next: AthleteTeamGame | null;
  upcoming: AthleteTeamGame[];
  previous: AthleteRecentGame[];
};

export type MyGamesTournament = { id: string; name: string };

const isLive = (game: Pick<AthleteTeamGame, 'live_state' | 'is_finished'>) =>
  !game.is_finished && game.live_state === 'in_progress';

// Still to be played: not finished, and either live or on a day from today on.
// A game from yesterday that was never closed is not the "next" one.
const isUpcoming = (game: AthleteTeamGame, todayKey: string) =>
  !game.is_finished &&
  game.live_state !== 'ended' &&
  (isLive(game) || (game.datetime !== null && gameDateKey(game.datetime) >= todayKey));

const byKickoff = (a: AthleteTeamGame, b: AthleteTeamGame) => (a.datetime ?? '').localeCompare(b.datetime ?? '');

// Every tournament among the loaded games, in the order they first appear:
// the upcoming games' (closest first), then the results' (newest first).
export const myGamesTournaments = (data: MyGamesData): MyGamesTournament[] => {
  const seen = new Map<string, MyGamesTournament>();
  const add = (tournament: { id: string; name: string } | null | undefined) => {
    if (tournament && !seen.has(tournament.id)) seen.set(tournament.id, { id: tournament.id, name: tournament.name });
  };
  [...data.teamGames].sort(byKickoff).forEach((game) => add(game.tournament));
  data.recentGames.forEach((recent) => add(recent.game.tournament));
  return [...seen.values()];
};

// A tournament that left the loaded games (after a refresh) reads as all.
export const effectiveTournamentId = (data: MyGamesData, tournamentId: string | null): string | null =>
  tournamentId && myGamesTournaments(data).some((tournament) => tournament.id === tournamentId) ? tournamentId : null;

export const filterMyGames = (data: MyGamesData, filter: MyGamesFilter, now: Date): MyGamesSections => {
  const tournamentId = effectiveTournamentId(data, filter.tournamentId);
  const inTournament = (tournament: { id: string } | null | undefined) =>
    tournamentId === null || tournament?.id === tournamentId;
  const todayKey = localDateKey(now);

  const upcoming = data.teamGames
    .filter((game) => isUpcoming(game, todayKey) && inTournament(game.tournament))
    .sort(byKickoff);
  const previous =
    filter.view === 'all' ? data.recentGames.filter((recent) => inTournament(recent.game.tournament)) : [];

  return { next: upcoming[0] ?? null, upcoming: upcoming.slice(1), previous };
};

// --- Presentation -----------------------------------------------------------

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SHORT_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

// Games are read in UTC: the API stores the typed wall clock as UTC.
const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const teamLabel = (team: ScheduleTeam | null, placeholder?: string | null): string =>
  team?.name || placeholder || 'A definir';

type Sides = Pick<AthleteTeamGame, 'home_team' | 'away_team' | 'home_placeholder' | 'away_placeholder'>;

// The athlete's side and the other one. A game where neither team is the
// athlete's (should not happen) reads from the home side.
export const athleteSides = (game: Sides, athleteTeamId: string) => {
  const isHome = game.away_team?.id !== athleteTeamId;
  return {
    isHome,
    team: isHome ? teamLabel(game.home_team, game.home_placeholder) : teamLabel(game.away_team, game.away_placeholder),
    opponent: isHome ? teamLabel(game.away_team, game.away_placeholder) : teamLabel(game.home_team, game.home_placeholder),
  };
};

// The tile beside a game: { day: '12', month: 'NOV' }.
export const dateTile = (iso: string | null | undefined) => {
  const date = parse(iso);
  return date ? { day: String(date.getUTCDate()), month: MONTHS[date.getUTCMonth()] } : { day: '--', month: '' };
};

// 'Quinta-feira, 12 de novembro'
export const longDate = (iso: string | null | undefined): string => {
  const date = parse(iso);
  if (!date) return 'Data a definir';
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} de ${MONTH_NAMES[date.getUTCMonth()]}`;
};

// '19:30'
export const kickoffTime = (iso: string | null | undefined): string => {
  const date = parse(iso);
  return date ? `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` : '--:--';
};

// 'NOV 2026', heading the more upcoming games.
export const monthHeading = (iso: string | null | undefined): string => {
  const date = parse(iso);
  return date ? `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` : '';
};

// How far the next game is: 'AO VIVO', 'HOJE', 'AMANHÃ' or 'EM 3 DIAS'.
export const countdownLabel = (game: AthleteTeamGame, now: Date): string => {
  if (isLive(game)) return 'AO VIVO';
  if (!game.datetime) return '';
  const days = Math.round(
    (Date.parse(`${gameDateKey(game.datetime)}T00:00:00Z`) - Date.parse(`${localDateKey(now)}T00:00:00Z`)) / DAY_MS
  );
  if (days <= 0) return 'HOJE';
  if (days === 1) return 'AMANHÃ';
  return `EM ${days} DIAS`;
};

export const statusLabel = (game: AthleteTeamGame): string => (isLive(game) ? 'Ao vivo' : 'Agendado');

// 'Casa · Ginásio Central', the venue from the athlete's side.
export const venueLabel = (game: AthleteTeamGame): string => {
  const side = athleteSides(game, game.athlete_team_id).isHome ? 'Casa' : 'Fora';
  const venue = game.location || game.city;
  return venue ? `${side} · ${venue}` : side;
};

// 'Dom · 18:00 · Fora · Eastside Court'
export const upcomingMeta = (game: AthleteTeamGame): string => {
  const date = parse(game.datetime);
  const day = date ? SHORT_WEEKDAYS[date.getUTCDay()] : null;
  return [day, date ? kickoffTime(game.datetime) : null, venueLabel(game)].filter(Boolean).join(' · ');
};

// '7 NOV · COPA CENTRAL'
export const resultHeading = (recent: AthleteRecentGame): string => {
  const tile = dateTile(recent.game.datetime);
  const date = tile.month ? `${tile.day} ${tile.month}` : '';
  return [date, recent.game.tournament?.name.toUpperCase()].filter(Boolean).join(' · ');
};

export const resultLabel = (recent: AthleteRecentGame): string | null => {
  if (recent.result === 'win') return 'VITÓRIA';
  if (recent.result === 'loss') return 'DERROTA';
  const { home_score: home, away_score: away } = recent.game;
  return home !== null && away !== null && home === away ? 'EMPATE' : null;
};

// The athlete's side first: 'Hawks vs Midtown' and '84–76'.
export const resultMatchup = (recent: AthleteRecentGame) => {
  const { game, athlete_team_id: athleteTeamId } = recent;
  const sides = athleteSides(game, athleteTeamId);
  const own = sides.isHome ? game.home_score : game.away_score;
  const other = sides.isHome ? game.away_score : game.home_score;
  return {
    title: `${sides.team} vs ${sides.opponent}`,
    score: own === null || other === null ? '–' : `${own}–${other}`,
  };
};

const STAT_LINE: { key: string; label: string }[] = [
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'minutes_played', label: 'MIN' },
];

// '28 PTS · 8 REB · 6 AST · 32 MIN', with only what the game recorded.
export const statLine = (stats: AthleteRecentGame['stats']): string =>
  STAT_LINE.filter(({ key }) => stats[key] !== undefined && stats[key] !== null && stats[key] !== '')
    .map(({ key, label }) => `${formatStatValue(key, stats[key])} ${label}`)
    .join('  ·  ');

// The membership the header reads: the selected tournament's, else the most
// recent one.
export const membershipFor = (
  memberships: AthleteMembership[] | undefined,
  tournamentId: string | null
): AthleteMembership | null =>
  (tournamentId ? memberships?.find((membership) => membership.tournament.id === tournamentId) : undefined) ??
  memberships?.[0] ??
  null;

// 'Ana Silva · Alpha · #7'
export const scheduleSubtitle = (profile: AthleteProfile, tournamentId: string | null): string => {
  const membership = membershipFor(profile.memberships, tournamentId);
  return [profile.name, membership?.team.name, membership?.shirt_number ? `#${membership.shirt_number}` : null]
    .filter(Boolean)
    .join(' · ');
};
