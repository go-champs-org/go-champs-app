import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGamesByPhaseId,
  fetchPlayoffData,
  fetchSportConfig,
  fetchTournamentDetails,
} from '../services/PlayoffService';
import { Draw } from '../models/PlayoffModel';
import { Game } from '../models/GameModel';

type TabKey = 'Playoffs' | 'Partidas';

export const usePlayoffViewModel = (tournamentId: string) => {
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
        // 1) Tournament to get phases and sport
        const tournament = await fetchTournamentDetails(tournamentId);
        // Try to locate the Playoffs phase by title or type
        const playoffsPhase =
          tournament.phases.find((p) => (p.title || '').toLowerCase() === 'playoffs') ||
          tournament.phases.find((p) => (p.type || '').toLowerCase() === 'draw') ||
          tournament.phases[0];

        const phaseId = playoffsPhase?.id ?? tournamentId; // Fallback to param just in case

        // 2) Fetch draw and games in parallel
        const [drawRes, gamesRes] = await Promise.all([
          fetchPlayoffData(phaseId),
          fetchGamesByPhaseId(phaseId),
        ]);

        const sortedDraws = [...(drawRes.data?.draws ?? [])].sort((a, b) => a.order - b.order);
        const sortedGames = [...gamesRes].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        if (!mounted) return;
        setDraws(sortedDraws);
        setGames(sortedGames);

        // Build team map from games
        const map: Record<string, { name: string; logo_url: string | null }> = {};
        sortedGames.forEach((g) => {
          if (g.home_team) map[g.home_team.id] = { name: g.home_team.name, logo_url: g.home_team.logo_url };
          if (g.away_team) map[g.away_team.id] = { name: g.away_team.name, logo_url: g.away_team.logo_url };
        });
        setTeamMap(map);

        // 3) Preload sport config if needed (not essential for UI right now)
        if (tournament.sport_slug) {
          fetchSportConfig(tournament.sport_slug).catch(() => undefined);
        }
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
  }, [tournamentId]);

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
