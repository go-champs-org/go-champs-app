import { useCallback, useEffect, useMemo, useState } from 'react';
import { GroupPhaseData } from '../models/GroupPhaseModel';
import { EliminationStat } from '../models/EliminationModel';
import { Game } from '../models/GameModel';
import { container } from '../di/container';
import { GroupRow } from '../domain/usecases/GetGroupPhaseOverviewUseCase';
import { TeamInfo } from '../domain/usecases/shared/phasePresentation';

type TabKey = 'Fase' | 'Partidas';

export const useGroupPhaseViewModel = (phaseId: string, tournamentId?: string, apiBaseUrl?: string) => {
  const [groupPhaseData, setGroupPhaseData] = useState<GroupPhaseData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [sortedStats, setSortedStats] = useState<EliminationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('Fase');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [teamMap, setTeamMap] = useState<Record<string, TeamInfo>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const overview = await container.getGroupPhaseOverview.execute(phaseId, tournamentId, apiBaseUrl);

        if (!mounted) return;
        setGroupPhaseData(overview.groupPhaseData);
        setGames(overview.games);
        setGroups(overview.groups);
        setSortedStats(overview.sortedStats);
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
  }, [phaseId, tournamentId, apiBaseUrl]);

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
    groupPhaseData,
    groups,
    sortedStats,
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
