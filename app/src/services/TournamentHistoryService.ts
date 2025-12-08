import { TournamentHistory } from '../models/TournamentHistory';
import { apiFetch } from './apiHelper';

const getTournamentHistory = async (id: string): Promise<TournamentHistory> => {
  try {
    const response = await apiFetch(`/tournaments/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Tournament not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (error: any) {
    console.error('Error fetching tournament history:', error);
    // Re-throw with more context but don't wrap in generic error
    throw error;
  }
};

export default getTournamentHistory;