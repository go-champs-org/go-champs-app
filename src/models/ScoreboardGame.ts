// The slice of the scoreboard's `/v1/games/:id` the app reads — the same
// fields the public site maps (go-champs-web apps/public/src/games/liveScore.ts).
export type ScoreboardTeam = {
  total_player_stats?: Record<string, number> | null;
};

export type ScoreboardGameResponse = {
  data: {
    home_team: ScoreboardTeam;
    away_team: ScoreboardTeam;
    live_state?: { state: string } | null;
  };
};
