import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchClassificationData,
  fetchGamesByPhaseId,
} from '../services/ClassificationService';
import { fetchTournamentDetails } from '../services/PlayoffService';
import { ClassificationData, Elimination } from '../models/ClassificationModel';
import { Game } from '../models/GameModel';

type TabKey = 'Classificação' | 'Partidas';

interface TeamInfo {
  name: string;
  logo_url: string | null;
}

interface ClassificationRow {
  team: TeamInfo;
  stats: Record<string, string | number>;
}

export const useClassificationViewModel = (phaseId: string, tournamentId?: string) => {
  const [classificationData, setClassificationData] = useState<ClassificationData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
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
        // Fetch classification data and games in parallel
        const [classificationRes, gamesRes] = await Promise.all([
          fetchClassificationData(phaseId),
          fetchGamesByPhaseId(phaseId),
        ]);

        if (!mounted) return;

        const sortedGames = [...gamesRes].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        setClassificationData(classificationRes);
        setGames(sortedGames);

        // Build team map from tournament teams or games
        const map: Record<string, TeamInfo> = {};
        
        // Try to get teams from tournament first
        if (tournamentId) {
          try {
            const tournament = await fetchTournamentDetails(tournamentId);
            if (tournament.teams && tournament.teams.length > 0) {
              tournament.teams.forEach((team) => {
                map[team.id] = { name: team.name, logo_url: team.logo_url };
              });
            }
          } catch (e) {
            console.warn('Could not fetch tournament teams, using games', e);
          }
        }

        // Fill missing teams from games (prioritize games data as it may have more complete info)
        sortedGames.forEach((g) => {
          if (g.home_team) {
            // Prefer logo from games if available, otherwise keep tournament logo
            const existingLogo = map[g.home_team.id]?.logo_url;
            const gameLogo = g.home_team?.logo_url;
            map[g.home_team.id] = { 
              name: g.home_team.name, 
              logo_url: gameLogo || existingLogo || null 
            };
          }
          if (g.away_team) {
            // Prefer logo from games if available, otherwise keep tournament logo
            const existingLogo = map[g.away_team.id]?.logo_url;
            const gameLogo = g.away_team?.logo_url;
            map[g.away_team.id] = { 
              name: g.away_team.name, 
              logo_url: gameLogo || existingLogo || null 
            };
          }
        });

        setTeamMap(map);
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
  }, [phaseId, tournamentId]);

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

  // Process classification data for display
  const classificationRows = useMemo((): ClassificationRow[] => {
    if (!classificationData || classificationData.eliminations.length === 0) return [];

    const elimination = classificationData.eliminations[0]; // Classificação tem apenas uma elimination
    const sortedStats = [...classificationData.elimination_stats].sort(
      (a, b) => a.ranking_order - b.ranking_order
    );

    return elimination.team_stats
      .map((teamStat) => {
        // Try to get team from teamMap, fallback to placeholder
        const teamFromMap = teamMap[teamStat.team_id];
        const team = teamFromMap || {
          name: teamStat.placeholder || 'Time',
          logo_url: null,
        };

        // Ensure logo_url is preserved if team was found in map
        const finalTeam = teamFromMap 
          ? { ...teamFromMap } 
          : team;

        const stats: Record<string, string | number> = {};
        sortedStats.forEach((stat) => {
          stats[stat.id] = teamStat.stats[stat.id] ?? 0;
        });

        return { team: finalTeam, stats };
      })
      .sort((a, b) => {
        // Sort by first stat with ranking_order > 0
        const firstStat = sortedStats.find((s) => s.ranking_order > 0);
        if (!firstStat) return 0;
        const aVal = Number(a.stats[firstStat.id] ?? 0);
        const bVal = Number(b.stats[firstStat.id] ?? 0);
        return bVal - aVal; // Descending
      });
  }, [classificationData, teamMap]);

  const sortedStats = useMemo(() => {
    if (!classificationData) return [];
    return [...classificationData.elimination_stats].sort(
      (a, b) => a.ranking_order - b.ranking_order
    );
  }, [classificationData]);

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

