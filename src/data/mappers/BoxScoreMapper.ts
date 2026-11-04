import { BoxScoreRow, BoxScoreTeam, GameDetail, PlayerStatsLog, TeamStatsLog } from '../../models/GameDetail';

// The saved box score of a game, the way the public game page builds it from
// the API's logs (go-champs-web apps/public/src/games/boxScore.ts).

export type BoxScorePlayer = {
  id: string;
  name: string;
  shirt_name?: string | null;
  photo_url?: string | null;
};

// The API stores every statistic as a string; an older log may carry numbers
// or nulls, which read the same as the string or as unrecorded.
const stringifyStats = (stats: Record<string, string | number | null> | null | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries(stats || {})
      .filter(([, value]) => value != null)
      .map(([slug, value]) => [slug, String(value)])
  );

// The tournament's roster names an athlete by the shirt name first; the
// game's own roster fills in an athlete the tournament no longer lists.
export const playersById = (players: BoxScorePlayer[]): Map<string, { name: string; photoUrl: string }> =>
  new Map(players.map((player) => [player.id, { name: player.shirt_name || player.name || '', photoUrl: player.photo_url || '' }]));

// A log for an athlete the roster no longer names still gets a line: the box
// score reports what the game recorded.
export const boxScoreRows = (
  logs: PlayerStatsLog[],
  players: Map<string, { name: string; photoUrl: string }>
): BoxScoreRow[] =>
  logs.map((log) => ({
    playerId: log.player_id,
    name: players.get(log.player_id)?.name || '',
    photoUrl: players.get(log.player_id)?.photoUrl || '',
    number: log.shirt_number || undefined,
    stats: stringifyStats(log.stats),
  }));

// A team with no totals log yet reads as an empty totals row.
export const teamTotals = (logs: TeamStatsLog[], teamId: string): Record<string, string> =>
  stringifyStats(logs.find((log) => log.team_id === teamId)?.stats);

export const buildBoxScoreTeam = (
  team: GameDetail['home_team'],
  placeholder: string,
  logs: PlayerStatsLog[],
  teamLogs: TeamStatsLog[],
  players: Map<string, { name: string; photoUrl: string }>
): BoxScoreTeam => {
  const teamId = team?.id || '';
  return {
    teamId,
    teamName: team?.name || placeholder,
    logoUrl: team?.logo_url || null,
    rows: teamId ? boxScoreRows(logs.filter((log) => log.team_id === teamId), players) : [],
    totals: teamId ? teamTotals(teamLogs, teamId) : {},
  };
};
