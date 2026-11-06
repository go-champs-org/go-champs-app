import { Tournament } from '../../../models/Tournament';

// The public home shows at most 15 tournaments, in the recent list and in the
// search results alike (go-champs-web apps/public orderRecentlyViews and
// SearchIsland MAX_RESULTS).
export const MAX_HOME_TOURNAMENTS = 15;

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

/** The recent tournaments the home lists: pinned first, capped like the public home. */
export const homeTournaments = (tournaments: Tournament[], pinnedIds: string[]): Tournament[] =>
  sortWithPinnedFirst(tournaments, pinnedIds).slice(0, MAX_HOME_TOURNAMENTS);

/** Search results keep the API order, capped like the public search. */
export const searchResults = (tournaments: Tournament[]): Tournament[] => tournaments.slice(0, MAX_HOME_TOURNAMENTS);
