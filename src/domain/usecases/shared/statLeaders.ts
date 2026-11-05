import { StatLeadersGroup } from '../../../models/StatLeaders';
import type { TournamentTeam } from '../GetTournamentOverviewUseCase';

export type StatScope = 'aggregate' | 'per_game';

type LeaderStatConfig = { slug: string; scopes: StatScope[] };

// A count ranks its total and its per-game average; a percentage is worked
// out from made and missed totals, so its per-game ranking is the same list.
const counted = (slug: string): LeaderStatConfig => ({ slug, scopes: ['aggregate', 'per_game'] });
const percentage = (slug: string): LeaderStatConfig => ({ slug, scopes: ['aggregate'] });

// The stats the tournament highlights, per sport, in card order — the same
// list the public site uses (apps/public/src/stats/statLeaders.ts). A sport
// that is not here gets no highlights.
const SPORT_LEADER_STATS: Record<string, LeaderStatConfig[]> = {
  basketball_5x5: [
    counted('points'),
    counted('rebounds'),
    counted('assists'),
    counted('plus_minus'),
    counted('steals'),
    counted('blocks'),
    counted('efficiency'),
    percentage('field_goal_percentage'),
    percentage('three_point_field_goal_percentage'),
  ],
};

export const SCOPE_LABELS: Record<StatScope, string> = { aggregate: 'Totais', per_game: 'Por jogo' };

export const PER_GAME_SUFFIX = '_per_game';
export const statKeyInScope = (slug: string, scope: StatScope): string =>
  scope === 'per_game' ? `${slug}${PER_GAME_SUFFIX}` : slug;

const LEADER_TITLES: Record<string, string> = {
  points: 'Pontos',
  rebounds: 'Rebotes',
  assists: 'Assistências',
  plus_minus: '+/-',
  steals: 'Roubadas',
  blocks: 'Tocos',
  efficiency: 'Eficiência',
  field_goal_percentage: '% 2 Pontos',
  three_point_field_goal_percentage: '% 3 Pontos',
};

// The CMS hides these from the public; a leaders card must never show them.
export const PRIVATE_STAT_SLUGS = new Set([
  'disqualifications',
  'ejections',
  'field_goals_attempted',
  'field_goals_missed',
  'fouls_flagrant',
  'fouls_personal',
  'fouls_technical',
  'free_throws_attempted',
  'free_throws_missed',
  'game_played',
  'game_started',
  'minutes_played',
  'three_point_field_goals_attempted',
  'three_point_field_goals_missed',
]);

export const LEADERS_PER_CARD = 3;

export type LeaderStat = {
  slug: string;
  title: string;
  // The stat key ranked in each scope the card offers, in toggle order.
  statKeys: Partial<Record<StatScope, string>>;
};

export type LeaderRow = {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  teamName: string;
  value: string;
};

export type LeaderCardScope = { scope: StatScope; statKey: string; leaders: LeaderRow[] };

export type LeaderCard = { slug: string; title: string; scopes: LeaderCardScope[] };

// A scope is offered only for a public stat the tournament records: a ranking
// of a stat it doesn't have would always be empty.
export const leaderStatsFor = (
  sportSlug: string,
  playerStats: { slug: string | null; title: string }[]
): LeaderStat[] => {
  const recorded = new Map(playerStats.map((stat) => [stat.slug || '', stat.title]));
  const visible = (key: string) => recorded.has(key) && !PRIVATE_STAT_SLUGS.has(key);

  return (SPORT_LEADER_STATS[sportSlug] || [])
    .map(({ slug, scopes }) => ({
      slug,
      title: LEADER_TITLES[slug] || recorded.get(slug) || slug,
      statKeys: Object.fromEntries(
        scopes.map((scope) => [scope, statKeyInScope(slug, scope)]).filter(([, key]) => visible(key))
      ) as Partial<Record<StatScope, string>>,
    }))
    .filter((stat) => Object.keys(stat.statKeys).length > 0);
};

// Every stat key the cards rank, for the single leaders request.
export const leaderStatKeys = (stats: LeaderStat[]): string[] =>
  stats.flatMap((stat) => Object.values(stat.statKeys) as string[]);

// A percentage is a whole number with a sign, a per-game average carries one
// decimal, and everything else is a count.
export const formatLeaderValue = (statKey: string, value: string | number | null): string => {
  const parsed = Number(value);
  if (value === null || value === '' || !Number.isFinite(parsed)) return '-';
  if (statKey.endsWith('_percentage')) return `${parsed.toFixed(0)}%`;
  return statKey.endsWith(PER_GAME_SUFFIX) ? parsed.toFixed(1) : parsed.toFixed(0);
};

// One card per stat, in config order, with the first leaders of each scope.
// A scope nobody qualified for yet is not offered, and a stat with no scope
// left has no card rather than an empty one.
export const leaderCards = (
  stats: LeaderStat[],
  groups: StatLeadersGroup[],
  teams: TournamentTeam[]
): LeaderCard[] => {
  const groupByKey = new Map(groups.map((group) => [group.stat_key, group]));
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  return stats.flatMap((stat) => {
    const scopes = (Object.entries(stat.statKeys) as [StatScope, string][]).flatMap(([scope, statKey]) => {
      const leaders = (groupByKey.get(statKey)?.leaders || []).slice(0, LEADERS_PER_CARD);
      return leaders.length === 0
        ? []
        : [{
            scope,
            statKey,
            leaders: leaders.map((leader) => ({
              playerId: leader.player_id,
              playerName: leader.player.name,
              photoUrl: leader.player.photo_url || null,
              teamName: (leader.team_id && teamNameById.get(leader.team_id)) || '',
              value: formatLeaderValue(statKey, leader.value),
            })),
          }];
    });

    return scopes.length > 0 ? [{ slug: stat.slug, title: stat.title, scopes }] : [];
  });
};
