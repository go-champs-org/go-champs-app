import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tournament } from '../models/Tournament';
import { container } from '../di/container';
import { homeTournaments } from '../domain/usecases/shared/homeTournaments';

export const useTournamentsViewModel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const togglePin = useCallback(async (tournamentId: string) => {
    try {
      const next = await container.togglePinnedTournament.execute(tournamentId);
      setPinnedIds(next);
    } catch (error) {
      console.error('Failed to toggle pinned tournament', error);
    }
  }, []);

  const visibleTournaments = useMemo(
    () => homeTournaments(tournaments, pinnedIds, searchQuery),
    [tournaments, pinnedIds, searchQuery]
  );

  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  return {
    tournaments: visibleTournaments,
    pinnedIds: pinnedIdSet,
    searchQuery,
    setSearchQuery,
    togglePin,
    loading,
  };
};

// Default export for Expo Router compatibility
export default useTournamentsViewModel;
