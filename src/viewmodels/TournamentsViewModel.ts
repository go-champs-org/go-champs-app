import { useState, useEffect } from 'react';
import { Tournament } from '../models/Tournament';
import { container } from '../di/container';

export const useTournamentsViewModel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await container.getRecentTournaments.execute();
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

// Default export for Expo Router compatibility
export default useTournamentsViewModel;
