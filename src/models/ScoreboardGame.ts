// The slice of the scoreboard's `/v1/games/:id` the app reads — the same
// fields the public site maps (go-champs-web apps/public/src/games/liveScore.ts).
export type ScoreboardPlayer = {
  id: string;
  name: string;
  number?: string | null;
  stats_values?: Record<string, number> | null;
};

export type ScoreboardTeam = {
  total_player_stats?: Record<string, number> | null;
  players?: ScoreboardPlayer[] | null;
};

export type ScoreboardGameResponse = {
  data: {
    home_team: ScoreboardTeam;
    away_team: ScoreboardTeam;
    live_state?: { state: string } | null;
    // `time` is the seconds left in the period.
    clock_state?: { period?: number | null; time?: number | null } | null;
  };
};
