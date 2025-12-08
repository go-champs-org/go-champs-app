import { useState, useEffect } from 'react';
import getTournamentHistory from '../services/TournamentHistoryService';
import { TournamentHistory } from '../models/TournamentHistory';

export const useTournamentHistoryViewModel = (id: string) => {
  const [tournament, setTournament] = useState<TournamentHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: TournamentHistory = await getTournamentHistory(id);
        setTournament(data);
      } catch (error: any) {
        console.error('Error fetching tournament history:', error);
        setError(error?.message || 'Erro ao carregar dados do torneio');
        setTournament(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentHistory();
  }, [id]);

  return { tournament, loading, error };
};
