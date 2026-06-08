import { Tournament } from '../models/Tournament';

const API_URL = 'https://go-champs-api-staging.herokuapp.com/v1/recently-view';

class TournamentsService {
  static async fetchTournaments(): Promise<Tournament[]> {
    try {
      const response = await fetch(API_URL);
      const jsonData = await response.json();
      console.log('Tournaments fetched successfully:', jsonData);
      return jsonData.data.map((item: any) => item.tournament);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }
  }
}

export default TournamentsService;