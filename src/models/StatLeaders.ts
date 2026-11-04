export interface StatLeader {
  player_id: string;
  team_id: string | null;
  value: string | number | null;
  player: {
    name: string;
    shirt_number?: string | null;
    photo_url?: string | null;
  };
}

export interface StatLeadersGroup {
  stat_key: string;
  qualifier?: string | null;
  leaders: StatLeader[];
}

export interface StatLeadersResponse {
  data: StatLeadersGroup[];
}
