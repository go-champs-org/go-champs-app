import { useState, useEffect } from 'react';
import { TournamentHistory } from '../models/TournamentHistory';
import { container } from '../di/container';

export const useTournamentHistoryViewModel = (id: string, apiBaseUrl?: string) => {
  const [tournament, setTournament] = useState<TournamentHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: TournamentHistory = await container.getTournamentHistory.execute(id, apiBaseUrl);
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
  }, [id, apiBaseUrl]);

  return { tournament, loading, error };
};
