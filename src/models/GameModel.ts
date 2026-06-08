export interface Team {
  id: string;
  logo_url: string | null;
  name: string;
  players: Player[]; // Changed 'any[]' to 'Player[]' for better typing
  tri_code: string | null;
}

export interface Player {
  id: string;
  name: string;
  position: string | null;
  stats: Record<string, any>; // Added a structure for player stats
}

export interface Game {
  id: string;
  phase_id: string;
  datetime: string;
  location: string;
  home_team: Team;
  away_team: Team;
  home_score: number;
  away_score: number;
  home_placeholder: string | null;
  away_placeholder: string | null;
  is_finished: boolean;
  live_state: string;
  live_started_at: string | null;
  live_ended_at: string | null;
  youtube_code: string | null;
  info: string | null;
  referee: string | null; // Added referee field
  attendance: number | null; // Added attendance field
}

export interface GameResponse {
  data: Game[];
}