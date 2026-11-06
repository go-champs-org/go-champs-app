import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tournament } from '../models/Tournament';
import { container } from '../di/container';
import { homeTournaments, searchResults } from '../domain/usecases/shared/homeTournaments';

// The public home waits this long after the last keystroke before searching.
export const SEARCH_DEBOUNCE_MS = 500;

type SearchState = {
  // The term these results answer, which trails the input by the debounce.
  term: string;
  results: Tournament[];
};

export const useTournamentsViewModel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ term: '', results: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const [data, pinned] = await Promise.all([
          container.getRecentTournaments.execute(),
          container.getPinnedTournamentIds.execute(),
        ]);
        setTournaments(data);
        setPinnedIds(pinned);
      } catch (error) {
        console.error('Failed to fetch tournaments', error);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) return undefined;

    let isCurrent = true;
    container.searchTournaments
      .execute(debouncedQuery)
      .catch(() => [])
      .then((results) => {
        if (isCurrent) setSearch({ term: debouncedQuery, results });
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  const togglePin = useCallback(async (tournamentId: string) => {
    try {
      const next = await container.togglePinnedTournament.execute(tournamentId);
      setPinnedIds(next);
    } catch (error) {
      console.error('Failed to toggle pinned tournament', error);
    }
  }, []);

  const term = searchQuery.trim();
  const isSearchMode = term.length > 0;
  // Until the results answer what is typed now, the search is still running.
  const searching = isSearchMode && search.term !== term;

  const visibleTournaments = useMemo(() => {
    if (!isSearchMode) return homeTournaments(tournaments, pinnedIds);
    return searching ? [] : searchResults(search.results);
  }, [isSearchMode, searching, tournaments, pinnedIds, search.results]);

  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  return {
    tournaments: visibleTournaments,
    pinnedIds: pinnedIdSet,
    searchQuery,
    setSearchQuery,
    isSearchMode,
    searching,
    togglePin,
    loading,
  };
};

// Default export for Expo Router compatibility
export default useTournamentsViewModel;
