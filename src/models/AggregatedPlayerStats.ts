export interface AggregatedPlayerStatsLog {
  id: string;
  player_id: string;
  // Numbers from the API, keyed by stat key; a stat not recorded is absent.
  stats: Record<string, string | number | null>;
}

export interface AggregatedPlayerStatsResponse {
  data: AggregatedPlayerStatsLog[];
}

// What narrows a tournament's ranking: the stat it is sorted by (best first),
// a phase, a team, one athlete, and minimums keyed by stat slug.
export interface AggregatedPlayerStatsQuery {
  sort?: string | null;
  phaseId?: string | null;
  teamId?: string | null;
  playerId?: string | null;
  minStats?: Record<string, number>;
}
