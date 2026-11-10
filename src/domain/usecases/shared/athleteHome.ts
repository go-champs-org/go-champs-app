import {
  AthleteMembership,
  AthleteRecentGame,
  AthleteSportCareer,
} from '../../repositories/AthleteProfileRepository';
import { formatStatValue } from './tournamentStats';

// The Perfil tab (Figma 1143:12176): the signed-in athlete's career summary
// per sport, their scoring form and the tournaments they play.

const SPORT_NAMES: Record<string, string> = {
  basketball_5x5: 'Basquete 5x5',
  basketball_3x3: 'Basquete 3x3',
};

export const sportLabel = (sportSlug: string | null | undefined, sportName?: string | null): string =>
  (sportSlug && SPORT_NAMES[sportSlug]) || sportName || sportSlug || 'Esporte';

const SUMMARY_STATS: { key: string; label: string }[] = [
  { key: 'points', label: 'Pontos' },
  { key: 'minutes_played', label: 'Minutos' },
  { key: 'rebounds', label: 'Rebotes' },
  { key: 'assists', label: 'Assistências' },
];

export type CareerRow = { key: string; label: string; total: string; perGame: string };

export type CareerSummary = {
  sportSlug: string;
  title: string;
  tournaments: string;
  games: string;
  rows: CareerRow[];
};

const MISSING = '—';
const present = (value: unknown) => value !== undefined && value !== null && value !== '';
const read = (key: string, value: unknown) =>
  present(value) ? formatStatValue(key, value as string | number) : MISSING;

// One card per sport. A stat the sport does not keep (3x3 has no rebounds)
// has no row; one it keeps but never recorded reads as a dash.
export const careerSummaries = (careers: AthleteSportCareer[] | undefined): CareerSummary[] =>
  (careers ?? []).map((career) => ({
    sportSlug: career.sport_slug,
    title: sportLabel(career.sport_slug, career.sport_name),
    tournaments: String(career.tournaments_count ?? 0),
    games: read('game_played', career.stats.game_played),
    rows: SUMMARY_STATS.filter(
      ({ key }) => present(career.stats[key]) || present(career.stats[`${key}_per_game`])
    ).map(({ key, label }) => ({
      key,
      label,
      total: read(key, career.stats[key]),
      perGame: read(`${key}_per_game`, career.stats[`${key}_per_game`]),
    })),
  }));

export type MonthBar = {
  key: string;
  points: number;
  label: string;
  // 'nov'
  month: string;
  // 'novembro de 2026', for screen readers
  monthLong: string;
  ratio: number;
  latest: boolean;
};

export const MONTHLY_SCORING_MONTHS = 5;

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const pointsOf = (recent: AthleteRecentGame) => {
  const points = Number(recent.stats.points);
  return Number.isFinite(points) ? points : 0;
};

// The points one sport's games scored per month ('2026-11'), read in UTC like
// every game date. The API sends at most the last 50 games, so the oldest
// month shown may be partial for a very busy athlete.
export const monthlyScoring = (recentGames: AthleteRecentGame[], sportSlug: string): MonthBar[] => {
  const totals = new Map<string, number>();
  recentGames
    .filter((recent) => (recent.game.tournament?.sport_slug ?? sportSlug) === sportSlug)
    .forEach((recent) => {
      const date = new Date(recent.game.datetime);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      totals.set(key, (totals.get(key) ?? 0) + pointsOf(recent));
    });

  // The last five months with games, oldest first; the latest is highlighted.
  const months = [...totals.keys()].sort().slice(-MONTHLY_SCORING_MONTHS);
  const best = Math.max(0, ...months.map((key) => totals.get(key) ?? 0));
  return months.map((key, index) => {
    const points = totals.get(key) ?? 0;
    const [year, month] = key.split('-').map(Number);
    return {
      key,
      points,
      label: String(Math.round(points)),
      month: MONTH_SHORT[month - 1],
      monthLong: `${MONTH_LONG[month - 1]} de ${year}`,
      ratio: best > 0 ? points / best : 0,
      latest: index === months.length - 1,
    };
  });
};

export type TournamentCard = {
  key: string;
  tournamentId: string;
  name: string;
  logoUrl: string | null;
  organization: string | null;
  sport: string;
  teamName: string;
  teamLogoUrl: string | null;
  // 'Alpha · #7'
  team: string;
};

export const MY_TOURNAMENTS_PREVIEW = 3;

// One card per membership (the API sends the most recent first).
export const tournamentCards = (memberships: AthleteMembership[] | undefined): TournamentCard[] =>
  (memberships ?? []).map((membership) => ({
    key: `${membership.tournament.id}:${membership.team.id}`,
    tournamentId: membership.tournament.id,
    name: membership.tournament.name,
    logoUrl: membership.tournament.logo_url ?? null,
    organization: membership.tournament.organization?.name ?? null,
    sport: sportLabel(membership.tournament.sport_slug, membership.tournament.sport_name),
    teamName: membership.team.name,
    teamLogoUrl: membership.team.logo_url ?? null,
    team: membership.shirt_number ? `${membership.team.name} · #${membership.shirt_number}` : membership.team.name,
  }));
