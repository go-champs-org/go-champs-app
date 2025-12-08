import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGroupPhaseData,
  fetchGamesByPhaseId,
} from '../services/GroupPhaseService';
import { fetchTournamentDetails } from '../services/PlayoffService';
import { GroupPhaseData, Elimination } from '../models/GroupPhaseModel';
import { Game } from '../models/GameModel';

type TabKey = 'Fase' | 'Partidas';

interface TeamInfo {
  name: string;
  logo_url: string | null;
}

interface GroupRow {
  group: Elimination;
  rows: Array<{
    team: TeamInfo;
    stats: Record<string, string | number>;
  }>;
}

export const useGroupPhaseViewModel = (phaseId: string, tournamentId?: string) => {
  const [groupPhaseData, setGroupPhaseData] = useState<GroupPhaseData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
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
        // Fetch group phase data and games in parallel
        const [groupPhaseRes, gamesRes] = await Promise.all([
          fetchGroupPhaseData(phaseId),
          fetchGamesByPhaseId(phaseId),
        ]);

        if (!mounted) return;

        const sortedGames = [...gamesRes].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        setGroupPhaseData(groupPhaseRes);
        setGames(sortedGames);

        // Build team map from tournament teams or games
        const map: Record<string, TeamInfo> = {};
        
        // Try to get teams from tournament first
        if (tournamentId) {
          try {
            const tournament = await fetchTournamentDetails(tournamentId);
            if (tournament.teams) {
              tournament.teams.forEach((team) => {
                map[team.id] = { name: team.name, logo_url: null }; // Grupos não usam logo
              });
            }
          } catch (e) {
            console.warn('Could not fetch tournament teams, using games', e);
          }
        }

        // Fill missing teams from games
        sortedGames.forEach((g) => {
          if (g.home_team && !map[g.home_team.id]) {
            map[g.home_team.id] = { name: g.home_team.name, logo_url: null }; // Grupos não usam logo
          }
          if (g.away_team && !map[g.away_team.id]) {
            map[g.away_team.id] = { name: g.away_team.name, logo_url: null }; // Grupos não usam logo
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

  // Process group phase data for display
  const groups = useMemo((): GroupRow[] => {
    if (!groupPhaseData || groupPhaseData.eliminations.length === 0) return [];

    const sortedStats = [...groupPhaseData.elimination_stats].sort(
      (a, b) => a.ranking_order - b.ranking_order
    );

    return groupPhaseData.eliminations
      .sort((a, b) => a.order - b.order)
      .map((elimination) => {
        const rows = elimination.team_stats
          .map((teamStat) => {
            const team = teamMap[teamStat.team_id] || {
              name: teamStat.placeholder || 'Time',
              logo_url: null,
            };

            const stats: Record<string, string | number> = {};
            sortedStats.forEach((stat) => {
              stats[stat.id] = teamStat.stats[stat.id] ?? 0;
            });

            return { team, stats };
          })
          .sort((a, b) => {
            // Sort by first stat with ranking_order > 0
            const firstStat = sortedStats.find((s) => s.ranking_order > 0);
            if (!firstStat) return 0;
            const aVal = Number(a.stats[firstStat.id] ?? 0);
            const bVal = Number(b.stats[firstStat.id] ?? 0);
            return bVal - aVal; // Descending
          });

        return { group: elimination, rows };
      });
  }, [groupPhaseData, teamMap]);

  const sortedStats = useMemo(() => {
    if (!groupPhaseData) return [];
    return [...groupPhaseData.elimination_stats].sort(
      (a, b) => a.ranking_order - b.ranking_order
    );
  }, [groupPhaseData]);

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

