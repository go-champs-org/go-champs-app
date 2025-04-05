import { PlayoffResponse } from '../models/PlayoffModel';
import { Game } from '../models/GameModel';

const BASE_URL = 'https://go-champs-api-staging.herokuapp.com/v1/phases';
const GAMES_URL = 'https://go-champs-api-staging.herokuapp.com/v1/games';

export const fetchPlayoffData = async (tournamentId: string): Promise<PlayoffResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/${tournamentId}`);
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error fetching playoff data:', error);
    throw error;
  }
};

export const fetchGamesByPhaseId = async (phaseId: string): Promise<Game[]> => {
  try {
    const response = await fetch(`${GAMES_URL}?where[phase_id]=${phaseId}`);
    const jsonData = await response.json();
    return jsonData.data;
  } catch (error) {
    console.error('Error fetching games data:', error);
    throw error;
  }
};
