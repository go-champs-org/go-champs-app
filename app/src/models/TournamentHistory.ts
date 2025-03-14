export interface TournamentHistory {
  data: Data;
}

export interface Data {
  facebook:                    string;
  has_aggregated_player_stats: boolean;
  id:                          string;
  instagram:                   string;
  name:                        string;
  organization:                Organization;
  phases:                      Phase[];
  player_stats:                PlayerStat[];
  players:                     Player[];
  registrations:               any[];
  scoreboard_setting:          string;
  site_url:                    string;
  slug:                        string;
  sport_name:                  string;
  sport_slug:                  string;
  team_stats:                  any[];
  teams:                       Team[];
  twitter:                     string;
  visibility:                  string;
}

export interface Organization {
  id:   string;
  name: string;
  slug: string;
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
  registration_response: string | null;
  shirt_name:            string | null;
  shirt_number:          string | null;
  team_id:               string | null;
  twitter:               string | null;
  username:              string | null;
}

export interface Team {
  id:      string;
  name:    string;
  players: any[];
}