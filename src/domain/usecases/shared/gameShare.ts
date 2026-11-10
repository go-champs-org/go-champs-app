import { AthleteProfile, AthleteRecentGame } from '../../repositories/AthleteProfileRepository';
import { athleteSides } from './myGames';
import { buildShareFormats, ShareFormat } from './shareFormats';
import { formatStatValue } from './tournamentStats';

// "Compartilhar jogo" (Meus jogos > Jogos anteriores): one result as a story
// sticker. The athlete, their shirt number and team, the tournament and the
// game's stats sit in the bottom left or the bottom right corner, each with the
// dark or the white and lime Go Champs logo.

export type GameShareLayout = 'bottom-left' | 'bottom-right';
export type GameShareFormat = ShareFormat<GameShareLayout>;

export const GAME_SHARE_FORMATS: GameShareFormat[] = buildShareFormats<GameShareLayout>({
  'bottom-left': { label: 'Esquerda', description: 'Conteúdo no canto inferior esquerdo' },
  'bottom-right': { label: 'Direita', description: 'Conteúdo no canto inferior direito' },
});

export type GameShareStat = { key: string; label: string; value: string };

export type GameShareMark = { name: string; logoUrl: string | null };

export type GameShareCard = {
  gameId: string;
  athleteName: string;
  // '#7', when the roster has it
  shirtNumber: string | null;
  team: GameShareMark | null;
  tournament: GameShareMark | null;
  // '7 nov 2026'
  date: string;
  stats: GameShareStat[];
};

// The same stats, labels and order as the result card's line.
const GAME_STATS: { key: string; label: string }[] = [
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'minutes_played', label: 'MIN' },
];

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Read in UTC, like every game date.
const gameDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

const present = (value: unknown) => value !== undefined && value !== null && value !== '';

/**
 * The sticker of one result. The shirt number and the tournament logo come
 * from the athlete's roster spot in that tournament (the profile's
 * memberships), the team logo from the game itself.
 */
export const gameShareCard = (recent: AthleteRecentGame, profile: AthleteProfile | null): GameShareCard => {
  const { game, athlete_team_id: athleteTeamId } = recent;
  const memberships = profile?.memberships ?? [];
  const tournamentId = game.tournament?.id;
  const membership =
    memberships.find((spot) => spot.tournament.id === tournamentId && spot.team.id === athleteTeamId) ??
    memberships.find((spot) => spot.tournament.id === tournamentId);
  const sides = athleteSides(game, athleteTeamId);
  const team = sides.isHome ? game.home_team : game.away_team;

  return {
    gameId: game.id,
    athleteName: profile?.name || profile?.username || '',
    shirtNumber: membership?.shirt_number ? `#${membership.shirt_number}` : null,
    team: team ? { name: team.name, logoUrl: team.logo_url ?? null } : null,
    tournament: game.tournament
      ? { name: game.tournament.name, logoUrl: membership?.tournament.logo_url ?? null }
      : null,
    date: gameDate(game.datetime),
    stats: GAME_STATS.filter(({ key }) => present(recent.stats[key])).map(({ key, label }) => ({
      key,
      label,
      value: formatStatValue(key, recent.stats[key]),
    })),
  };
};
