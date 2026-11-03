import { Game } from '../../../models/GameModel';

export type TeamInfo = {
  name: string;
  logo_url: string | null;
  tri_code?: string | null;
};

export type TeamMap = Record<string, TeamInfo>;

export type PhaseKind = 'standings' | 'bracket';

// Mirrors the public site: an elimination phase shows standings, a draw phase
// shows its bracket, and any other type has nothing to show yet.
export const phaseKind = (phase: { type?: string | null }): PhaseKind | null => {
  const type = (phase.type || '').toLowerCase();
  if (type === 'draw') return 'bracket';
  if (type === 'elimination') return 'standings';
  return null;
};

// Same label the public site puts in a standings row: the tri-code when the
// team has one, else its name, else what the organizer wrote for the slot.
export const teamShortName = (team: TeamInfo | undefined, placeholder: string | null, fallback: string): string =>
  team?.tri_code || team?.name || placeholder || fallback;

export const sortGamesByDate = (games: Game[]): Game[] =>
  [...games].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

export const buildTeamMap = (
  games: Game[],
  teams: { id: string; name: string; logo_url?: string | null; tri_code?: string | null }[] = []
): TeamMap => {
  const map: TeamMap = {};

  teams.forEach((team) => {
    map[team.id] = { name: team.name, logo_url: team.logo_url || null, tri_code: team.tri_code || null };
  });

  games.forEach((game) => {
    [game.home_team, game.away_team].forEach((team) => {
      if (!team) return;
      map[team.id] = {
        name: team.name,
        logo_url: team.logo_url || map[team.id]?.logo_url || null,
        tri_code: team.tri_code || map[team.id]?.tri_code || null,
      };
    });
  });

  return map;
};

export const dateKeyOf = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const buildDateKeys = (games: Game[]): string[] =>
  Array.from(new Set(games.map((game) => dateKeyOf(game.datetime)))).sort();

const DAY = 24 * 60 * 60 * 1000;
const dayNumber = (key: string): number => {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY;
};

// The match day nearest to today, so a phase in progress opens on this week's
// games rather than its first round; on a tie the upcoming day wins.
export const closestDateKey = (dateKeys: string[], today: Date): string | null => {
  if (dateKeys.length === 0) return null;
  const target = dayNumber(dateKeyOf(today.toISOString()));

  return dateKeys.reduce((best, key) => {
    const distance = Math.abs(dayNumber(key) - target);
    const bestDistance = Math.abs(dayNumber(best) - target);
    if (distance < bestDistance) return key;
    if (distance === bestDistance && dayNumber(key) > dayNumber(best)) return key;
    return best;
  });
};
