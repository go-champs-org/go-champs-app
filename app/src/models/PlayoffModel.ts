export interface Match {
  id: string;
  name: string;
  first_team_id: string | null;
  first_team_score: string | null;
  second_team_id: string | null;
  second_team_score: string | null;
  first_team_placeholder: string | null;
  second_team_placeholder: string | null;
}

export interface Draw {
  id: string;
  title: string;
  order: number;
  matches: Match[];
}

export interface PlayoffData {
  draws: Draw[];
}

export interface PlayoffResponse {
  data: PlayoffData;
}