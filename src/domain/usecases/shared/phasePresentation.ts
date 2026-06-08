import { EliminationStat } from '../../../models/EliminationModel';
import { Game } from '../../../models/GameModel';
import { TournamentDetails } from '../../../models/TournamentDetails';

export type TeamInfo = {
  name: string;
  logo_url: string | null;
};

export type TeamMap = Record<string, TeamInfo>;

export const sortGamesByDate = (games: Game[]): Game[] =>
  [...games].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

export const sortStatsByRanking = <T extends EliminationStat>(stats: T[]): T[] =>
  [...stats].sort((a, b) => a.ranking_order - b.ranking_order);

export const buildTeamMap = (
  games: Game[],
  tournament?: TournamentDetails,
  options: { includeLogos: boolean } = { includeLogos: true }
): TeamMap => {
  const map: TeamMap = {};

  tournament?.teams?.forEach((team) => {
    map[team.id] = {
      name: team.name,
      logo_url: options.includeLogos ? team.logo_url : null,
    };
  });

  games.forEach((game) => {
    if (game.home_team) {
      const existingLogo = map[game.home_team.id]?.logo_url;
      map[game.home_team.id] = {
        name: game.home_team.name,
        logo_url: options.includeLogos ? game.home_team.logo_url || existingLogo || null : null,
      };
    }

    if (game.away_team) {
      const existingLogo = map[game.away_team.id]?.logo_url;
      map[game.away_team.id] = {
        name: game.away_team.name,
        logo_url: options.includeLogos ? game.away_team.logo_url || existingLogo || null : null,
      };
    }
  });

  return map;
};

export const buildDateKeys = (games: Game[]): string[] => {
  const dates = new Set<string>();

  games.forEach((game) => {
    const date = new Date(game.datetime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    dates.add(key);
  });

  return Array.from(dates).sort();
};

