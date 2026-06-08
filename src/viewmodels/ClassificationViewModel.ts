import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassificationData } from '../models/ClassificationModel';
import { EliminationStat } from '../models/EliminationModel';
import { Game } from '../models/GameModel';
import { container } from '../di/container';
import { ClassificationRow } from '../domain/usecases/GetClassificationOverviewUseCase';
import { TeamInfo } from '../domain/usecases/shared/phasePresentation';

type TabKey = 'Classificação' | 'Partidas';

export const useClassificationViewModel = (phaseId: string, tournamentId?: string, apiBaseUrl?: string) => {
  const [classificationData, setClassificationData] = useState<ClassificationData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [classificationRows, setClassificationRows] = useState<ClassificationRow[]>([]);
  const [sortedStats, setSortedStats] = useState<EliminationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('Classificação');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [teamMap, setTeamMap] = useState<Record<string, TeamInfo>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const overview = await container.getClassificationOverview.execute(phaseId, tournamentId, apiBaseUrl);

        if (!mounted) return;
        setClassificationData(overview.classificationData);
        setGames(overview.games);
        setClassificationRows(overview.classificationRows);
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
    classificationData,
    classificationRows,
    sortedStats,
    games,
    loading,
    error,
    activeTab,
    dateKeys,
    selectedDate,
    gamesForSelectedDate,
    teamMap, // Export teamMap for debugging/verification
    // actions
    setActiveTab: setTab,
    setSelectedDate,
  };
};
