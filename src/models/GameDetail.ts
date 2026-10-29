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
  stats: Record<string, string | number | null>;
};

export type PlayerStatsLogResponse = {
  data: PlayerStatsLog[];
};

export type BoxScoreColumnKey =
  | 'min'
  | 'pts'
  | 'reb'
  | 'ass'
  | 'toc'
  | 'rou'
  | 'err'
  | 'eff'
  | 'plusMinus'
  | 'll'
  | 'llPct'
  | 'twoPt'
  | 'twoPtPct'
  | 'threePt'
  | 'threePtPct';

export type BoxScoreColumn = {
  key: BoxScoreColumnKey;
  label: string;
};

export type BoxScoreRow = {
  playerId: string;
  playerName: string;
  shirtNumber: string | null;
  values: Record<BoxScoreColumnKey, string>;
};

export type BoxScoreTeamSection = {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  rows: BoxScoreRow[];
};

export type GameOverview = {
  game: GameDetail;
  boxScore: BoxScoreTeamSection[];
};
