// An athlete as a tournament registers them (GET /players/:id): the roster
// entry the public athlete page is built on — not the account-level athlete
// profile, which is keyed by username and lives outside any tournament.
export type TournamentAthlete = {
  id: string;
  name: string;
  photo_url?: string | null;
  team_id?: string | null;
  shirt_name?: string | null;
  shirt_number?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  username?: string | null;
};

export type TournamentAthleteResponse = {
  data: TournamentAthlete;
};
