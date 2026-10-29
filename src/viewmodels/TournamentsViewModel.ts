import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tournament } from '../models/Tournament';
import { container } from '../di/container';

const sortWithPinnedFirst = (tournaments: Tournament[], pinnedIds: string[]) => {
  if (pinnedIds.length === 0) {
    return tournaments;
  }

  const pinnedIndex = new Map(pinnedIds.map((id, index) => [id, index]));
  return [...tournaments].sort((left, right) => {
    const leftPinned = pinnedIndex.has(left.id);
    const rightPinned = pinnedIndex.has(right.id);
    if (leftPinned && rightPinned) {
      return (pinnedIndex.get(left.id) ?? 0) - (pinnedIndex.get(right.id) ?? 0);
    }
    if (leftPinned) return -1;
    if (rightPinned) return 1;
    return 0;
  });
};

export const useTournamentsViewModel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
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

  const sortedTournaments = useMemo(
    () => sortWithPinnedFirst(tournaments, pinnedIds),
    [tournaments, pinnedIds]
  );

  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  return {
    tournaments: sortedTournaments,
    pinnedIds: pinnedIdSet,
    togglePin,
    loading,
  };
};

// Default export for Expo Router compatibility
export default useTournamentsViewModel;
