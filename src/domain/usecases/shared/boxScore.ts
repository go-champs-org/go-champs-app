import { BoxScoreColumn, BoxScoreRow, BoxScoreTeamStats } from '../../../models/GameDetail';
import { isLiveGame } from './liveScore';
import { PER_GAME_SUFFIX, PRIVATE_STAT_SLUGS } from './statLeaders';
import { statLabelOf } from './tournamentStats';

// The box score of the public game page (go-champs-web
// apps/public/src/games/boxScore.ts and src/stats/rosterStats.ts).

export const BASKETBALL_5X5 = 'basketball_5x5';

const FULL_LIVE_UPDATE = 'full-live-update';

// Basketball's box score is a fixed set of columns, the fields a basketball
// scoresheet always carries — not derived from the tournament's statistics.
// Whether an athlete played or started is not a column: a starter is marked
// next to the name and one who never got in reads "Não jogou" across the row.
const BASKETBALL_5X5_COLUMNS: BoxScoreColumn[] = [
  { slug: 'minutes_played', label: 'MIN', description: 'Minutos jogados' },
  { slug: 'points', label: 'PTS', description: 'Pontos' },
  { slug: 'rebounds', label: 'REB', description: 'Rebotes' },
  { slug: 'assists', label: 'ASS', description: 'Assistências' },
  { slug: 'blocks', label: 'TOC', description: 'Tocos' },
  { slug: 'steals', label: 'ROU', description: 'Roubadas' },
  { slug: 'turnovers', label: 'ERR', description: 'Erros' },
  {
    slug: 'efficiency',
    label: 'EFF',
    description: 'Eficiência básica por Martin Manley (1986) = PTS + REB + AST + ROU + TOC − Arremessos errados - TO',
  },
  { slug: 'plus_minus', label: '+/-', description: 'Diferença de pontos quando o atleta está em quadra' },
  {
    slug: 'free_throws_made',
    attemptedSlug: 'free_throws_attempted',
    label: 'LL',
    description: 'Lances livres convertidos / lances livres tentados',
  },
  { slug: 'free_throw_percentage', label: 'LL%', description: 'Lances livres percentual de acerto' },
  {
    slug: 'field_goals_made',
    attemptedSlug: 'field_goals_attempted',
    label: '2PT',
    description: '2 pontos convertidos / 2 pontos tentados',
  },
  { slug: 'field_goal_percentage', label: '2PT%', description: '2 pontos percentual de acerto' },
  {
    slug: 'three_point_field_goals_made',
    attemptedSlug: 'three_point_field_goals_attempted',
    label: '3PTs',
    description: '3 pontos convertidos / 3 pontos tentados',
  },
  { slug: 'three_point_field_goal_percentage', label: '3PT%', description: '3 pontos percentual de acerto' },
  { slug: 'rebounds_offensive', label: 'REO', description: 'Rebotes ofensivos' },
  { slug: 'rebounds_defensive', label: 'RED', description: 'Rebotes defensivos' },
  { slug: 'fouls_personal', label: 'FLP', description: 'Faltas pessoais' },
  { slug: 'fouls_technical', label: 'FLT', description: 'Faltas técnicas' },
  { slug: 'fouls_flagrant', label: 'FLF', description: 'Faltas flagrantes' },
  { slug: 'disqualifications', label: 'DSQ', description: 'Desqualificações' },
];

// The statistics a sport records for a single game: the API's sport catalog
// (/sports, level "game"), which the public site narrows the tournament's
// statistics to. A sport not listed here keeps every statistic it records.
const SPORT_GAME_STATS: Record<string, string[]> = {
  basketball_3x3: [
    'disqualifying_fouls',
    'free_throw_made',
    'game_played',
    'one_point_made',
    'one_point_missed',
    'one_point_attempted',
    'one_point_percentage',
    'plus_minus',
    'points',
    'two_point_made',
    'two_point_missed',
    'two_point_attempted',
    'two_point_percentage',
    'unsportsmanlike_fouls',
  ],
};

// The sport's column order; a statistic it does not order goes after the
// ones it does, in the tournament's order.
const SPORT_COLUMN_ORDER: Record<string, string[]> = {
  basketball_3x3: [
    'points',
    'one_point_made',
    'one_point_attempted',
    'one_point_percentage',
    'two_point_made',
    'two_point_attempted',
    'two_point_percentage',
    'free_throw_made',
    'unsportsmanlike_fouls',
    'disqualifying_fouls',
  ],
};

export type TournamentPlayerStat = { id?: string | null; slug: string | null; title: string };

// Basketball 5x5 uses its fixed set. Any other sport lists the tournament's
// public, single-game statistics — never a per-game average, which only means
// something across a season — in the sport's order, headed in pt-BR.
export const boxScoreColumns = (sportSlug: string, playerStats: TournamentPlayerStat[]): BoxScoreColumn[] => {
  if (sportSlug === BASKETBALL_5X5) return BASKETBALL_5X5_COLUMNS;
  const gameStats = SPORT_GAME_STATS[sportSlug];
  const order = SPORT_COLUMN_ORDER[sportSlug] ?? [];
  const rank = (slug: string) => {
    const index = order.indexOf(slug);
    return index === -1 ? order.length : index;
  };
  const seen = new Set<string>();

  return playerStats
    .map((stat) => ({ slug: stat.slug || stat.id || '', title: stat.title }))
    .filter((stat) => {
      if (!stat.slug || seen.has(stat.slug)) return false;
      seen.add(stat.slug);
      return true;
    })
    .filter((stat) => !stat.slug.endsWith(PER_GAME_SUFFIX) && !PRIVATE_STAT_SLUGS.has(stat.slug))
    .filter((stat) => !gameStats || gameStats.includes(stat.slug))
    .sort((left, right) => rank(left.slug) - rank(right.slug))
    .map((stat) => ({ slug: stat.slug, ...statLabelOf(stat.slug, stat.title) }));
};

// A game in progress shows its box score when the tournament opted into full
// live updates, even before any log is saved: the live lines only exist in the
// scoreboard. A finished or upcoming game shows it whenever logs exist.
export const shouldShowBoxScore = (
  liveState: string | null | undefined,
  liveSiteUpdate: string | null,
  logCount: number
): boolean => (isLiveGame(liveState) ? liveSiteUpdate === FULL_LIVE_UPDATE : logCount > 0);

// Only a live game the tournament opted into full live updates for reads its
// box score off the scoreboard; everything else keeps the saved logs.
export const pollsLiveBoxScore = (liveState: string | null | undefined, liveSiteUpdate: string | null): boolean =>
  isLiveGame(liveState) && liveSiteUpdate === FULL_LIVE_UPDATE;

// An unrecorded statistic arrives empty, which `Number` would read as a real
// zero: every cell reads through here so the dash, the ranking and the sort
// agree on what missing means.
const parseStat = (value: string | undefined): number | null => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : null;
};

// Minutes are recorded in seconds and read as a clock, MM:SS.
export const formatSecondsAsClock = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

// A percentage is a whole number with a sign; everything else is a count.
export const formatStatValue = (slug: string, value: string | undefined): string => {
  const parsed = parseStat(value);
  if (parsed === null) return '-';
  return slug.endsWith('_percentage') ? `${parsed.toFixed(0)}%` : parsed.toFixed(0);
};

export const boxScoreCellValue = (column: BoxScoreColumn, stats: Record<string, string>): string => {
  if (column.slug === 'minutes_played') {
    const seconds = parseStat(stats.minutes_played);
    return seconds === null ? '-' : formatSecondsAsClock(seconds);
  }
  const made = formatStatValue(column.slug, stats[column.slug]);
  if (!column.attemptedSlug) return made;
  return `${made} / ${formatStatValue(column.attemptedSlug, stats[column.attemptedSlug])}`;
};

// A log that says 0 games played is an athlete on the roster who never got
// in; a log without the stat at all (older games) reads as played.
export const didNotPlay = (stats: Record<string, string>): boolean =>
  Boolean(stats.game_played) && Number(stats.game_played) === 0;

export const isStarter = (stats: Record<string, string>): boolean => Number(stats.game_started) > 0;

export type SortDirection = 'asc' | 'desc';
export type BoxScoreSort = { slug: string; direction: SortDirection };

const MISSING = Number.NEGATIVE_INFINITY;
const SIGN: Record<SortDirection, number> = { asc: 1, desc: -1 };

// An athlete with no value for the column sorts to the bottom both ways.
const byStat = (slug: string, direction: SortDirection) => (left: BoxScoreRow, right: BoxScoreRow): number => {
  const leftValue = parseStat(left.stats[slug]) ?? MISSING;
  const rightValue = parseStat(right.stats[slug]) ?? MISSING;
  const rankDelta = Number(leftValue === MISSING) - Number(rightValue === MISSING);
  if (rankDelta) return rankDelta;
  return leftValue === MISSING ? 0 : SIGN[direction] * (leftValue - rightValue);
};

const sortRows = (rows: BoxScoreRow[], slug: string, direction: SortDirection): BoxScoreRow[] =>
  [...rows].sort(byStat(slug, direction));

// The starters first, then whoever played the most, then whoever scored the
// most — the way a basketball box score reads from top to bottom.
export const boxScoreRanking = (sportSlug: string): string[] =>
  sportSlug === BASKETBALL_5X5 ? ['game_started', 'minutes_played', 'points'] : [];

// Sorting by the last key first leaves the rows in the order of the first key,
// ties broken by the next ones: each sort is stable.
export const rankRows = (rows: BoxScoreRow[], ranking: string[]): BoxScoreRow[] =>
  [...ranking].reverse().reduce((ranked, slug) => sortRows(ranked, slug, 'desc'), rows);

// The scoreboard does not know the roster's photos, so a live line takes the
// one the saved box score has for the same athlete.
export const withLiveStats = <Team extends BoxScoreTeamStats>(
  team: Team,
  live: BoxScoreTeamStats,
  ranking: string[]
): Team => {
  const photos = new Map(team.rows.map((row) => [row.playerId, row.photoUrl || '']));
  const rows = live.rows.map((row) => ({ ...row, photoUrl: row.photoUrl || photos.get(row.playerId) || '' }));
  return { ...team, totals: live.totals, rows: rankRows(rows, ranking) };
};

// A header tap ranks the column best first; the same column again turns it
// around. Every other header starts over from best first.
export const nextBoxScoreSort = (sort: BoxScoreSort | null, slug: string): BoxScoreSort =>
  sort?.slug === slug ? { slug, direction: sort.direction === 'desc' ? 'asc' : 'desc' } : { slug, direction: 'desc' };

export const sortedBoxScoreTeam = <Team extends BoxScoreTeamStats>(team: Team, sort: BoxScoreSort | null): Team =>
  sort ? { ...team, rows: sortRows(team.rows, sort.slug, sort.direction) } : team;
