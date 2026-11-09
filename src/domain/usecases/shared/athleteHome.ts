import {
  AthleteMembership,
  AthleteRecentGame,
  AthleteSportCareer,
} from '../../repositories/AthleteProfileRepository';
import { dateTile } from './myGames';
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

export type FormBar = { gameId: string; points: number; label: string; date: string; ratio: number; latest: boolean };

export const SCORING_FORM_GAMES = 5;

const pointsOf = (recent: AthleteRecentGame) => {
  const points = Number(recent.stats.points);
  return Number.isFinite(points) ? points : 0;
};

// The last five games of one sport, oldest first, each bar sized against the
// best of them; the latest game is highlighted.
export const scoringForm = (recentGames: AthleteRecentGame[], sportSlug: string): FormBar[] => {
  const games = recentGames
    .filter((recent) => (recent.game.tournament?.sport_slug ?? sportSlug) === sportSlug)
    .slice(0, SCORING_FORM_GAMES)
    .reverse();
  const best = Math.max(0, ...games.map(pointsOf));
  return games.map((recent, index) => {
    const points = pointsOf(recent);
    const tile = dateTile(recent.game.datetime);
    return {
      gameId: recent.game.id,
      points,
      label: String(Math.round(points)),
      date: tile.month ? `${tile.day} ${tile.month.toLowerCase()}` : '',
      ratio: best > 0 ? points / best : 0,
      latest: index === games.length - 1,
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
