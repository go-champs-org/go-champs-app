import { StatLeadersGroup } from '../../../models/StatLeaders';
import type { TournamentTeam } from '../GetTournamentOverviewUseCase';

// The stats the tournament highlights, per sport, in card order — the same
// list the public site uses (apps/public/src/stats/statLeaders.ts). A sport
// that is not here gets no highlights.
const SPORT_LEADER_STATS: Record<string, string[]> = {
  basketball_5x5: [
    'points',
    'rebounds',
    'assists',
    'plus_minus',
    'steals',
    'blocks',
    'efficiency',
    'field_goal_percentage',
    'three_point_field_goal_percentage',
  ],
};

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
const PRIVATE_STAT_SLUGS = new Set([
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

export type LeaderStat = { slug: string; title: string };

export type LeaderRow = {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  teamName: string;
  value: string;
};

export type LeaderCard = LeaderStat & { leaders: LeaderRow[] };

// Only stats the tournament records can be ranked, and only public ones.
export const leaderStatsFor = (
  sportSlug: string,
  playerStats: { slug: string | null; title: string }[]
): LeaderStat[] => {
  const recorded = new Map(playerStats.map((stat) => [stat.slug || '', stat.title]));

  return (SPORT_LEADER_STATS[sportSlug] || [])
    .filter((slug) => recorded.has(slug) && !PRIVATE_STAT_SLUGS.has(slug))
    .map((slug) => ({ slug, title: LEADER_TITLES[slug] || recorded.get(slug) || slug }));
};

export const formatLeaderValue = (slug: string, value: string | number | null): string => {
  const parsed = Number(value);
  if (value === null || value === '' || !Number.isFinite(parsed)) return '-';
  return slug.endsWith('_percentage') ? `${parsed.toFixed(0)}%` : parsed.toFixed(0);
};

// One card per stat, in config order; a stat nobody qualified for yet has no
// card rather than an empty one.
export const leaderCards = (
  stats: LeaderStat[],
  groups: StatLeadersGroup[],
  teams: TournamentTeam[]
): LeaderCard[] => {
  const groupByKey = new Map(groups.map((group) => [group.stat_key, group]));
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  return stats.flatMap((stat) => {
    const leaders = (groupByKey.get(stat.slug)?.leaders || []).slice(0, LEADERS_PER_CARD);
    if (leaders.length === 0) return [];

    return [{
      ...stat,
      leaders: leaders.map((leader) => ({
        playerId: leader.player_id,
        playerName: leader.player.name,
        photoUrl: leader.player.photo_url || null,
        teamName: (leader.team_id && teamNameById.get(leader.team_id)) || '',
        value: formatLeaderValue(stat.slug, leader.value),
      })),
    }];
  });
};
