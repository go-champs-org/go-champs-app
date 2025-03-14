import { useState, useEffect } from 'react';
import TournamentsService from '../services/TournamentsService';
import { Tournament } from '../models/Tournament';

export const useTournamentsViewModel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await TournamentsService.fetchTournaments();
        setTournaments(data);
      } catch (error) {
        console.error('Failed to fetch tournaments', error);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  return { tournaments, loading };
};