import { TournamentHistory } from '../models/TournamentHistory';

const API_URL = 'https://go-champs-api-staging.herokuapp.com/v1/tournaments';

const getTournamentHistory = async (id: string): Promise<TournamentHistory> => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error fetching tournament history:', error);
    throw new Error('Error fetching tournament history');
  }
};

export default getTournamentHistory;