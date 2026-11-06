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

const matchesQuery = (tournament: Tournament, query: string) =>
  `${tournament.name} ${tournament.organization.name}`.toLowerCase().includes(query);

/**
 * What the home lists: the tournaments matching the search by name or
 * organization, pinned first, capped like the public home. The cap applies
 * after the search, so a match is never lost behind the first 15.
 */
export const homeTournaments = (tournaments: Tournament[], pinnedIds: string[], query: string): Tournament[] => {
  const term = query.trim().toLowerCase();
  const matching = term ? tournaments.filter((tournament) => matchesQuery(tournament, term)) : tournaments;

  return sortWithPinnedFirst(matching, pinnedIds).slice(0, MAX_HOME_TOURNAMENTS);
};
