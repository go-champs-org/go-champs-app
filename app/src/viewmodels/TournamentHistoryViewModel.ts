import { useState, useEffect } from 'react';
import getTournamentHistory from '../services/TournamentHistoryService';
import { TournamentHistory } from '../models/TournamentHistory';

export const useTournamentHistoryViewModel = (id: string) => {
  const [tournament, setTournament] = useState<TournamentHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTournamentHistory = async () => {
      try {
        const data: TournamentHistory = await getTournamentHistory(id);
        setTournament(data);
      } catch (error) {
        console.error('Error fetching tournament history:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentHistory();
  }, [id]);

  return { tournament, loading };
};
