import { useCallback, useEffect, useMemo, useState } from 'react';
import { Draw } from '../models/PlayoffModel';
import { Game } from '../models/GameModel';
import { container } from '../di/container';

type TabKey = 'Playoffs' | 'Partidas';

export const usePlayoffViewModel = (tournamentId: string, apiBaseUrl?: string, phaseId?: string) => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('Playoffs');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [teamMap, setTeamMap] = useState<Record<string, { name: string; logo_url: string | null }>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const overview = await container.getPlayoffOverview.execute(tournamentId, apiBaseUrl, phaseId);

        if (!mounted) return;
        setDraws(overview.draws);
        setGames(overview.games);
        setTeamMap(overview.teamMap);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Erro ao carregar dados');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tournamentId, apiBaseUrl, phaseId]);

  // Build unique date list from games
  const dateKeys = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      const d = new Date(g.datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      set.add(key);
    });
    const arr = Array.from(set).sort();
    return arr;
  }, [games]);

  // Initialize selected date
  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  const gamesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [] as Game[];
    return games.filter((g) => {
      const d = new Date(g.datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      return key === selectedDate;
    });
  }, [games, selectedDate]);

  const setTab = useCallback((tab: TabKey) => setActiveTab(tab), []);

  return {
    // state
    draws,
    games,
    loading,
    error,
    activeTab,
    dateKeys,
    selectedDate,
    gamesForSelectedDate,
    teamMap,
    // actions
    setActiveTab: setTab,
    setSelectedDate,
  };
};
