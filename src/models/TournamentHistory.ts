export interface TournamentHistory {
  data: Data;
}

export interface Data {
  facebook:                    string;
  has_aggregated_player_stats: boolean;
  id:                          string;
  instagram:                   string;
  logo_url?:                   string | null;
  name:                        string;
  organization:                Organization;
  phases:                      Phase[];
  player_stats:                PlayerStat[];
  players:                     Player[];
  registrations:               any[];
  scoreboard_setting?:         ScoreboardSetting | null;
  site_url:                    string;
  slug:                        string;
  sport_name:                  string;
  sport_slug:                  string;
  team_stats:                  any[];
  teams:                       Team[];
  twitter:                     string;
  visibility:                  string;
}

export interface ScoreboardSetting {
  live_site_update?: string | null;
}

export interface Organization {
  id:       string;
  logo_url?: string | null;
  name:     string;
  slug:     string;
}

export interface Phase {
  elimination_stats: EliminationStat[];
  id:                string;
  is_in_progress:    boolean;
  order:             number;
  title:             string;
  type:              string;
}

export interface EliminationStat {
  id:               string;
  ranking_order:    string | null;
  team_stat_source: string | null;
  title:            string;
}

export interface PlayerStat {
  id:               string;
  is_default_order: string | null;
  slug:             string | null;
  title:            string;
}

export interface Player {
  facebook:              string | null;
  id:                    string;
  instagram:             string | null;
  name:                  string;
  photo_url?:            string | null;
  registration_response: string | null;
  shirt_name:            string | null;
  shirt_number:          string | null;
  team_id:               string | null;
  twitter:               string | null;
  username:              string | null;
}

export interface Team {
  id:        string;
  logo_url?: string | null;
  name:      string;
  tri_code?: string | null;
  players:   any[];
}
