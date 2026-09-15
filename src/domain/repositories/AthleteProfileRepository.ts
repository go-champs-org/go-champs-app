export type AthleteProfile = {
  id: string;
  username: string;
  name: string;
  photo_url: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  tournaments?: AthleteTournamentSummary[];
  career_stats?: AthleteCareerStat[];
};

export type AthleteTournamentSummary = {
  id: string;
  name: string;
  slug?: string;
};

export type AthleteCareerStat = {
  id?: string;
  title?: string;
  value?: string | number;
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

export interface AthleteProfileRepository {
  getByUsername(username: string): Promise<AthleteProfile | null>;
  create(input: AthleteProfileInput): Promise<AthleteProfile>;
  updateByUsername(username: string, input: AthleteProfileInput): Promise<AthleteProfile>;
  getMySchedules(): Promise<ScheduleGame[]>;
}
