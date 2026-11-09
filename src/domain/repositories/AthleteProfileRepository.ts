export type AthleteProfile = {
  id: string;
  username: string;
  name: string;
  photo_url: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tournaments?: AthleteTournamentSummary[];
  memberships?: AthleteMembership[];
  career_stats?: AthleteSportCareer[];
};

export type AthleteTournamentSummary = {
  id: string;
  name: string;
  slug?: string;
};

export type AthleteMembership = {
  tournament: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    sport_slug?: string | null;
    sport_name?: string | null;
    organization: { id: string; name: string; slug: string } | null;
  };
  team: { id: string; name: string; logo_url?: string | null; tri_code?: string | null };
  shirt_number: string | null;
};

// The athlete's career in one sport: totals and per-game averages over every
// tournament they played, keyed by the sport's stat slugs.
export type AthleteSportCareer = {
  sport_slug: string;
  sport_name: string | null;
  tournaments_count: number;
  stats: Record<string, number | string | null>;
};

export type AthleteProfileInput = {
  name: string;
  photo_url?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
};

export type ScheduleTeam = {
  id: string;
  name: string;
  logo_url?: string | null;
};

export type ScheduleGame = {
  id: string;
  datetime: string | null;
  location: string | null;
  city: string | null;
  court: string | null;
  is_finished: boolean;
  live_state: string | null;
  home_score: number | null;
  away_score: number | null;
  home_placeholder?: string | null;
  away_placeholder?: string | null;
  home_team: ScheduleTeam | null;
  away_team: ScheduleTeam | null;
  tournament: { id: string; name: string; slug: string } | null;
};

// A game of one of the athlete's teams; `athlete_team_id` is their side.
export type AthleteTeamGame = ScheduleGame & { athlete_team_id: string };

export type AthleteRecentGame = {
  game: {
    id: string;
    datetime: string;
    home_team: ScheduleTeam | null;
    home_placeholder?: string | null;
    home_score: number | null;
    away_team: ScheduleTeam | null;
    away_placeholder?: string | null;
    away_score: number | null;
    tournament: { id: string; name: string; slug: string; sport_slug?: string | null } | null;
  };
  athlete_team_id: string;
  result: 'win' | 'loss' | null;
  stats: Record<string, number | string | null>;
};

export interface AthleteProfileRepository {
  getByUsername(username: string): Promise<AthleteProfile | null>;
  create(input: AthleteProfileInput): Promise<AthleteProfile>;
  updateByUsername(username: string, input: AthleteProfileInput): Promise<AthleteProfile>;
  // Public: the games of the athlete's own teams, from yesterday to 30 days ahead.
  getTeamSchedule(username: string): Promise<AthleteTeamGame[]>;
  // Public: the athlete's latest finished games (at most 50), newest first.
  getRecentGames(username: string): Promise<AthleteRecentGame[]>;
}
