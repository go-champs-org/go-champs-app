import { Tournament } from '../../../models/Tournament';

// The home lists at most 12 recent tournaments.
export const MAX_HOME_TOURNAMENTS = 12;

// Search shows at most 15 results, like the public search (go-champs-web
// apps/public SearchIsland MAX_RESULTS).
export const MAX_SEARCH_RESULTS = 15;

/**
 * Pinned tournaments head the list in the order they were pinned and the API
 * order carries the rest.
 */
export const sortWithPinnedFirst = (tournaments: Tournament[], pinnedIds: string[]): Tournament[] => {
  if (pinnedIds.length === 0) {
    return tournaments;
  }

  // Unpinned tournaments all share the last rank; the sort is stable, so they
  // keep the API order.
  const pinnedIndex = new Map(pinnedIds.map((id, index) => [id, index]));
  const rank = (tournament: Tournament) => pinnedIndex.get(tournament.id) ?? pinnedIds.length;
  return [...tournaments].sort((left, right) => rank(left) - rank(right));
};

/** The recent tournaments the home lists: pinned first, capped at MAX_HOME_TOURNAMENTS. */
export const homeTournaments = (tournaments: Tournament[], pinnedIds: string[]): Tournament[] =>
  sortWithPinnedFirst(tournaments, pinnedIds).slice(0, MAX_HOME_TOURNAMENTS);

/** Search results keep the API order, capped like the public search. */
export const searchResults = (tournaments: Tournament[]): Tournament[] => tournaments.slice(0, MAX_SEARCH_RESULTS);
