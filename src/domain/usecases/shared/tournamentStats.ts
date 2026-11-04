import { AggregatedPlayerStatsLog } from '../../../models/AggregatedPlayerStats';
import type { TournamentOverview, TournamentPlayer, TournamentTeam } from '../GetTournamentOverviewUseCase';
import { formatLeaderValue, PER_GAME_SUFFIX, PRIVATE_STAT_SLUGS, StatScope, statKeyInScope } from './statLeaders';

// The tournament stats screen mirrors the public site's
// (apps/public/app/[locale]/[org]/[tournament]/stats): the whole season, so
// it also carries what a single game leaves out — games, minutes, attempts
// and fouls. It is the table, not the stat, that decides what is a column, so
// the private list of the highlights does not apply to a sport listed here.
const BASKETBALL_5X5_ORDER = [
  'game_played',
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

const BASKETBALL_3X3_ORDER = [
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
];

// Only the aggregate slugs: a per-game column is the same slug with a suffix,
// so one list orders both scopes. A sport that is not here lists its public
// stats in the order the tournament configured them.
const SPORT_STATS_ORDER: Record<string, string[]> = {
  basketball_5x5: BASKETBALL_5X5_ORDER,
  basketball_3x3: BASKETBALL_3X3_ORDER,
};

// The header of a column is the abbreviation the sport is read in; the
// description is what the glossary and the screen reader get.
const STAT_ABBREVIATIONS: Record<string, string> = {
  points: 'PTS',
  rebounds: 'REB',
  rebounds_offensive: 'REO',
  rebounds_defensive: 'RED',
  assists: 'AST',
  blocks: 'TOC',
  steals: 'ROU',
  turnovers: 'ERR',
  free_throws_made: 'LLC',
  free_throw_percentage: 'LL%',
  field_goals_made: '2PC',
  field_goal_percentage: '2P%',
  three_point_field_goals_made: '3PC',
  three_point_field_goal_percentage: '3P%',
  one_point_made: '1PC',
  one_point_attempted: '1PT',
  one_point_percentage: '1P%',
  two_point_made: '2PC',
  two_point_attempted: '2PT',
  two_point_percentage: '2P%',
  free_throw_made: 'LLC',
  plus_minus: '+/-',
  unsportsmanlike_fouls: 'FA',
  disqualifying_fouls: 'FD',
  game_played: 'JOG',
  efficiency: 'EFF',
  game_started: 'TIT',
  minutes_played: 'MIN',
  free_throws_attempted: 'LLT',
  field_goals_attempted: '2PT',
  three_point_field_goals_attempted: '3PT',
  fouls_personal: 'FLP',
  fouls_technical: 'FLT',
  fouls_flagrant: 'FLF',
};

const STAT_DESCRIPTIONS: Record<string, string> = {
  points: 'Pontos',
  game_played: 'Jogos',
  rebounds: 'Rebotes',
  assists: 'Assistências',
  blocks: 'Tocos',
  steals: 'Roubadas',
  turnovers: 'Erros',
  free_throws_made: 'Lances livres convertidos',
  free_throw_percentage: 'Porcentagem de lances livres',
  field_goals_made: 'Arremessos de 2 pontos convertidos',
  field_goal_percentage: 'Porcentagem de arremessos de 2 pontos',
  three_point_field_goals_made: 'Arremessos de 3 pontos convertidos',
  three_point_field_goal_percentage: 'Porcentagem de arremessos de 3 pontos',
  rebounds_offensive: 'Rebotes ofensivos',
  rebounds_defensive: 'Rebotes defensivos',
  one_point_made: 'Arremessos de 1 ponto convertidos',
  one_point_attempted: 'Arremessos de 1 ponto tentados',
  one_point_percentage: 'Porcentagem de arremessos de 1 ponto',
  two_point_made: 'Arremessos de 2 pontos convertidos',
  two_point_attempted: 'Arremessos de 2 pontos tentados',
  two_point_percentage: 'Porcentagem de arremessos de 2 pontos',
  free_throw_made: 'Lances livres convertidos',
  plus_minus: 'Mais/menos',
  unsportsmanlike_fouls: 'Faltas antidesportivas',
  disqualifying_fouls: 'Faltas desqualificantes',
  efficiency: 'Eficiência',
  game_started: 'Jogos como titular',
  minutes_played: 'Minutos jogados',
  free_throws_attempted: 'Lances livres tentados',
  field_goals_attempted: 'Arremessos de 2 pontos tentados',
  three_point_field_goals_attempted: 'Arremessos de 3 pontos tentados',
  fouls_personal: 'Faltas pessoais',
  fouls_technical: 'Faltas técnicas',
  fouls_flagrant: 'Faltas flagrantes',
};

// The stats a sport offers a minimum filter for; narrowed to the ones the
// tournament records, or the filter would leave every athlete out.
const SPORT_MIN_STAT_FILTERS: Record<string, string[]> = {
  basketball_5x5: ['game_played'],
  basketball_3x3: ['game_played'],
};

// Ranked best first by points wherever the tournament records them.
const DEFAULT_SORT_SLUG = 'points';

export type StatColumn = { key: string; label: string; description: string };

export type StatFilterOption = { id: string; label: string };

export type TournamentStatsLayout = {
  scopes: StatScope[];
  columnsByScope: Partial<Record<StatScope, StatColumn[]>>;
  phases: StatFilterOption[];
  teams: StatFilterOption[];
  minStatFilters: StatFilterOption[];
};

export type StatsRowTeam = { id: string; name: string; logoUrl: string | null; triCode: string };

export type TournamentStatsRow = {
  playerId: string;
  name: string;
  photoUrl: string | null;
  team: StatsRowTeam | null;
  stats: Record<string, string | number | null>;
};

export const baseStatSlug = (key: string): string =>
  key.endsWith(PER_GAME_SUFFIX) ? key.slice(0, -PER_GAME_SUFFIX.length) : key;

export const scopeOfStatKey = (key: string): StatScope => (key.endsWith(PER_GAME_SUFFIX) ? 'per_game' : 'aggregate');

const columnOf = (key: string, title: string): StatColumn => ({
  key,
  label: STAT_ABBREVIATIONS[baseStatSlug(key)] || title,
  description: STAT_DESCRIPTIONS[baseStatSlug(key)] || title,
});

// The tournament's own stats in one scope, narrowed to the sport's table and
// in its order. A sport with no table keeps every public stat, in API order.
export const statColumnsFor = (
  sportSlug: string,
  playerStats: TournamentOverview['playerStats'],
  scope: StatScope
): StatColumn[] => {
  const order = SPORT_STATS_ORDER[sportSlug] || [];
  const rank = (key: string) => {
    const index = order.indexOf(baseStatSlug(key));
    return index === -1 ? order.length : index;
  };

  return playerStats
    .filter((stat): stat is { slug: string; title: string } => Boolean(stat.slug))
    .filter((stat) => scopeOfStatKey(stat.slug) === scope)
    .filter((stat) => (order.length > 0 ? order.includes(baseStatSlug(stat.slug)) : !PRIVATE_STAT_SLUGS.has(baseStatSlug(stat.slug))))
    .sort((left, right) => rank(left.slug) - rank(right.slug))
    .map((stat) => columnOf(stat.slug, stat.title));
};

// A phase filter needs two phases to narrow anything; a team filter one team.
export const tournamentStatsLayout = (tournament: TournamentOverview): TournamentStatsLayout => {
  const columnsByScope: Partial<Record<StatScope, StatColumn[]>> = {};
  if (tournament.hasAggregatedPlayerStats) {
    (['aggregate', 'per_game'] as StatScope[]).forEach((scope) => {
      const columns = statColumnsFor(tournament.sportSlug, tournament.playerStats, scope);
      if (columns.length > 0) columnsByScope[scope] = columns;
    });
  }
  const recorded = new Set(tournament.playerStats.map((stat) => stat.slug));

  return {
    scopes: Object.keys(columnsByScope) as StatScope[],
    columnsByScope,
    phases: tournament.phases.length > 1 ? tournament.phases.map((phase) => ({ id: phase.id, label: phase.title })) : [],
    teams: tournament.teams.map((team) => ({ id: team.id, label: team.name })),
    minStatFilters: (SPORT_MIN_STAT_FILTERS[tournament.sportSlug] || [])
      .filter((slug) => recorded.has(slug))
      .map((slug) => ({ id: slug, label: `${STAT_DESCRIPTIONS[slug] || slug} (mín.)` })),
  };
};

// The ranking a scope opens on: points, best first, when the scope has them;
// otherwise the order the API sends.
export const defaultStatKey = (layout: TournamentStatsLayout, scope: StatScope): string | null => {
  const key = statKeyInScope(DEFAULT_SORT_SLUG, scope);
  return (layout.columnsByScope[scope] || []).some((column) => column.key === key) ? key : null;
};

// Where a requested ranking (a highlight's "Ver todos") opens: its own scope
// when that scope has the column, the first scope's default otherwise.
export const initialStatsSelection = (
  layout: TournamentStatsLayout,
  requestedKey?: string | null
): { scope: StatScope; statKey: string | null } | null => {
  if (layout.scopes.length === 0) return null;
  if (requestedKey) {
    const scope = scopeOfStatKey(requestedKey);
    if ((layout.columnsByScope[scope] || []).some((column) => column.key === requestedKey)) {
      return { scope, statKey: requestedKey };
    }
  }
  const scope = layout.scopes[0];
  return { scope, statKey: defaultStatKey(layout, scope) };
};

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// Minutes are recorded in seconds: the season reads as whole minutes, one
// game's average as a clock. Everything else reads like the highlights.
export const formatStatValue = (key: string, value: string | number | null | undefined): string => {
  const parsed = Number(value);
  const missing = value === null || value === undefined || value === '' || !Number.isFinite(parsed);
  if (!missing && key === 'minutes_played') return String(Math.floor(parsed / 60));
  if (!missing && key === `minutes_played${PER_GAME_SUFFIX}`) return clock(parsed);
  return formatLeaderValue(key, value ?? null);
};

// Keeps the API's rank order. Only athletes on the tournament's roster are
// listed: a log of someone no longer there has no name to show.
export const tournamentStatsRows = (
  logs: AggregatedPlayerStatsLog[],
  players: TournamentPlayer[],
  teams: TournamentTeam[]
): TournamentStatsRow[] => {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  return logs.flatMap((log) => {
    const player = playerById.get(log.player_id);
    if (!player) return [];
    const team = player.team_id ? teamById.get(player.team_id) : undefined;
    return [{
      playerId: player.id,
      name: player.name,
      photoUrl: player.photo_url,
      team: team
        ? { id: team.id, name: team.name, logoUrl: team.logo_url, triCode: team.tri_code || team.name.slice(0, 3).toUpperCase() }
        : null,
      stats: log.stats || {},
    }];
  });
};
