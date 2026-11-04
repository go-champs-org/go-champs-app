import { Game } from './GameModel';

export type GameAsset = {
  id: string;
  type: string;
  url: string;
};

export type GameOfficial = {
  id: string;
  official_id: string | null;
  role: string | null;
  official: {
    id: string;
    name: string;
    username?: string | null;
    federation?: string | null;
  } | null;
};

export type GameCoach = {
  id: string;
  name: string;
  type: string | null;
};

export type GameRosterPlayer = {
  id: string;
  name: string;
  shirt_number?: string | null;
  photo_url?: string | null;
  username?: string | null;
};

export type GameDetailTeam = {
  id: string;
  name: string;
  logo_url: string | null;
  tri_code: string | null;
  players: GameRosterPlayer[];
  coaches?: GameCoach[];
};

export type GameDetailTournament = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
};

export type GameDetail = Omit<Game, 'home_team' | 'away_team' | 'referee' | 'attendance'> & {
  city: string | null;
  court: string | null;
  number: string | null;
  result_type: string | null;
  assets: GameAsset[];
  officials: GameOfficial[];
  web_url: string | null;
  home_team: GameDetailTeam | null;
  away_team: GameDetailTeam | null;
  phase?: {
    id: string;
    title: string | null;
    type: string | null;
    tournament?: GameDetailTournament | null;
  } | null;
};

export type GameDetailResponse = {
  data: GameDetail;
};

export type PlayerStatsLog = {
  id: string;
  game_id: string;
  phase_id: string | null;
  player_id: string;
  team_id: string;
  tournament_id: string | null;
  shirt_number?: string | null;
  stats: Record<string, string | number | null>;
};

export type PlayerStatsLogResponse = {
  data: PlayerStatsLog[];
};

export type TeamStatsLog = {
  id: string;
  game_id: string;
  team_id: string;
  stats: Record<string, string | number | null>;
};

export type TeamStatsLogResponse = {
  data: TeamStatsLog[];
};

// A column of the box score: the abbreviation it is headed by and what it
// means. A made/attempted pair reads as one column, "10 / 15".
export type BoxScoreColumn = {
  slug: string;
  label: string;
  description: string;
  attemptedSlug?: string;
};

// One athlete's line, every statistic as the string the API stores it as.
export type BoxScoreRow = {
  playerId: string;
  name: string;
  stats: Record<string, string>;
  photoUrl?: string;
  number?: string;
};

export type BoxScoreTeamStats = {
  rows: BoxScoreRow[];
  totals: Record<string, string>;
};

export type BoxScoreTeam = BoxScoreTeamStats & {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
};

export type GameBoxScore = {
  columns: BoxScoreColumn[];
  // The keys rows rank by, best first (starters, then minutes, then points).
  ranking: string[];
  home: BoxScoreTeam;
  away: BoxScoreTeam;
};

export type GameOverview = {
  game: GameDetail;
  sportSlug: string;
  liveSiteUpdate: string | null;
  // Null when the page has no box score section at all.
  boxScore: GameBoxScore | null;
};
