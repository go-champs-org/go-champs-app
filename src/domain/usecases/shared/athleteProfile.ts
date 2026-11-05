import { PlayerStatsLog } from '../../../models/GameDetail';
import { boxScoreColumns, TournamentPlayerStat } from './boxScore';
import { PER_GAME_SUFFIX, StatScope } from './statLeaders';
import { formatStatValue, StatColumn, statLabelOf } from './tournamentStats';

// The tournament athlete page of the public site
// (go-champs-web apps/public/app/[locale]/[org]/[tournament]/athlete/[playerId],
// src/stats/playerPhaseStats.ts and src/players/socialLinks.ts).

// A Basketball 5x5 profile reads the athlete's season the way the tournament
// stats screen reads everyone's, minus the games played, which the table
// already carries as its own column.
const BASKETBALL_5X5_PROFILE = [
  'game_started',
  'minutes_played',
  'points',
  'rebounds',
  'assists',
  'blocks',
  'steals',
  'turnovers',
  'efficiency',
  'plus_minus',
  'free_throws_made',
  'free_throws_attempted',
  'free_throw_percentage',
  'field_goals_made',
  'field_goals_attempted',
  'field_goal_percentage',
  'three_point_field_goals_made',
  'three_point_field_goals_attempted',
  'three_point_field_goal_percentage',
  'rebounds_offensive',
  'rebounds_defensive',
  'fouls_personal',
  'fouls_technical',
  'fouls_flagrant',
];

const BASKETBALL_3X3_PROFILE = [
  'points',
  'one_point_made',
  'one_point_percentage',
  'two_point_made',
  'two_point_percentage',
  'free_throw_made',
];

const PROFILE_STAT_ORDER: Record<string, string[]> = {
  basketball_5x5: BASKETBALL_5X5_PROFILE,
  basketball_3x3: BASKETBALL_3X3_PROFILE,
};

// The curated set of the sport, in its order, narrowed to the stats the
// tournament records — the curated set decides a column, private ones
// included. A sport with no curated set lists every game-level stat it
// publishes, the columns its box score shows.
export const athleteProfileColumns = (sportSlug: string, playerStats: TournamentPlayerStat[]): StatColumn[] => {
  const order = PROFILE_STAT_ORDER[sportSlug] ?? [];
  if (order.length === 0) {
    return boxScoreColumns(sportSlug, playerStats).map(({ slug, label, description }) => ({ key: slug, label, description }));
  }
  const titleBySlug = new Map(playerStats.filter((stat) => stat.slug).map((stat) => [stat.slug as string, stat.title]));

  return order
    .filter((slug) => titleBySlug.has(slug))
    .map((slug) => ({ key: slug, ...statLabelOf(slug, titleBySlug.get(slug) as string) }));
};

// One row of the per-phase table: a phase (or the total), the games it
// covers, and the running sum and count of every stat in it. Counts sit next
// to the sums so a percentage with no attempts to work it out from can be
// averaged rather than added.
export type PhaseStatRow = {
  phaseId: string;
  label: string;
  games: number;
  sums: Record<string, number>;
  counts: Record<string, number>;
};

export type AthletePhaseTable = { rows: PhaseStatRow[]; total: PhaseStatRow };

type PhaseRef = { id: string; title: string; order: number };

// An unrecorded stat arrives empty, which `Number` would read as a real zero.
const parseNum = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Games is the number of logs: one per game the athlete appeared in.
const aggregate = (phaseId: string, label: string, logs: PlayerStatsLog[]): PhaseStatRow => {
  const row: PhaseStatRow = { phaseId, label, games: logs.length, sums: {}, counts: {} };
  logs.forEach((log) =>
    Object.entries(log.stats ?? {}).forEach(([slug, value]) => {
      const parsed = parseNum(value);
      if (parsed === null) return;
      row.sums[slug] = (row.sums[slug] ?? 0) + parsed;
      row.counts[slug] = (row.counts[slug] ?? 0) + 1;
    })
  );
  return row;
};

// One row per phase the athlete has a game in, in phase order, plus a total
// across all of them. A phase never played is left out, not an empty row.
export const athletePhaseTable = (logs: PlayerStatsLog[], phases: PhaseRef[]): AthletePhaseTable => {
  const grouped = new Map<string, PlayerStatsLog[]>();
  logs.forEach((log) => {
    const key = log.phase_id ?? '';
    grouped.set(key, [...(grouped.get(key) ?? []), log]);
  });

  const rows = [...phases]
    .sort((left, right) => left.order - right.order)
    .filter((phase) => grouped.has(phase.id))
    .map((phase) => aggregate(phase.id, phase.title, grouped.get(phase.id) ?? []));

  return { rows, total: aggregate('', 'Total', logs) };
};

// A shooting percentage is worked out from the makes and attempts it was
// recorded with, so a 1/1 night weighs no more than a 1/10 one.
const SHOTS_BY_PERCENTAGE: Record<string, { made: string; attempted: string }> = {
  free_throw_percentage: { made: 'free_throws_made', attempted: 'free_throws_attempted' },
  field_goal_percentage: { made: 'field_goals_made', attempted: 'field_goals_attempted' },
  three_point_field_goal_percentage: { made: 'three_point_field_goals_made', attempted: 'three_point_field_goals_attempted' },
};

// A percentage the sport records no attempts for is the average of the games
// it was recorded in.
const percentageCell = (slug: string, row: PhaseStatRow): string => {
  const shots = SHOTS_BY_PERCENTAGE[slug];
  const attempted = shots ? row.sums[shots.attempted] : undefined;
  if (shots && attempted !== undefined) {
    return attempted > 0 ? `${(((row.sums[shots.made] ?? 0) / attempted) * 100).toFixed(0)}%` : '-';
  }
  const sum = row.sums[slug];
  return sum === undefined || !row.counts[slug] ? '-' : `${(sum / row.counts[slug]).toFixed(0)}%`;
};

// A game holds at most one start: it stays a count in either scope, like the
// games column next to it.
const COUNTED_ONCE_PER_GAME = new Set(['game_started']);

// The formatted value of one column for one row, in the chosen scope. Every
// other stat is a running count, whole as a total or divided by the games;
// minutes read as whole minutes in total and a clock per game. A column the
// row has no number for reads as a dash, not a zero.
export const phaseCellValue = (slug: string, row: PhaseStatRow, scope: StatScope): string => {
  if (slug.endsWith('_percentage')) return percentageCell(slug, row);
  const sum = row.sums[slug];
  if (sum === undefined) return '-';
  if (scope !== 'per_game' || COUNTED_ONCE_PER_GAME.has(slug)) return formatStatValue(slug, sum);
  return row.games > 0 ? formatStatValue(`${slug}${PER_GAME_SUFFIX}`, sum / row.games) : '-';
};

// The banner's line under the name.
export const gamesPlayedText = (games: number): string =>
  games === 1 ? '1 jogo disputado' : games > 1 ? `${games} jogos disputados` : '';

export type SocialNetwork = 'instagram' | 'twitter' | 'facebook';
export type SocialLink = { network: SocialNetwork; url: string };

const NETWORK_HOSTS: Record<SocialNetwork, string> = {
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
  facebook: 'https://facebook.com',
};

const NETWORKS: SocialNetwork[] = ['instagram', 'twitter', 'facebook'];

// A handle is stored however it was typed: with or without the @.
export const athleteSocialLinks = (handles: Partial<Record<SocialNetwork, string | null>>): SocialLink[] =>
  NETWORKS.map((network) => ({ network, handle: (handles[network] ?? '').trim().replace(/^@/, '') }))
    .filter(({ handle }) => handle !== '')
    .map(({ network, handle }) => ({ network, url: `${NETWORK_HOSTS[network]}/${handle}` }));
