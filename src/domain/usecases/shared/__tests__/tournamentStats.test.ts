import { TournamentOverview } from '../../GetTournamentOverviewUseCase';
import {
  baseStatSlug,
  defaultStatKey,
  formatStatValue,
  initialStatsSelection,
  scopeOfStatKey,
  statColumnsFor,
  tournamentStatsLayout,
  tournamentStatsRows,
} from '../tournamentStats';

const stats = (...slugs: (string | null)[]) => slugs.map((slug) => ({ slug, title: `T ${slug}` }));

const tournament = (overrides: Partial<TournamentOverview> = {}): TournamentOverview => ({
  id: 't1',
  name: 'Copa',
  slug: 'copa',
  logoUrl: null,
  organizationName: 'Org',
  organizationSlug: 'org',
  isActive: true,
  teams: [{ id: 'team-a', name: 'Alpha', logo_url: 'https://example.com/a.png', tri_code: 'ALP' }, { id: 'team-b', name: 'Beta', logo_url: null, tri_code: null }],
  players: [],
  phases: [
    { id: 'ph1', title: 'Classificação', order: 1, isInProgress: false, kind: 'standings' },
    { id: 'ph2', title: 'Playoffs', order: 2, isInProgress: true, kind: 'bracket' },
  ],
  defaultPhaseId: 'ph2',
  hasAggregatedPlayerStats: true,
  sportSlug: 'basketball_5x5',
  playerStats: stats('assists', 'points', 'disqualifications', 'game_played', 'points_per_game', 'minutes_played_per_game', null),
  ...overrides,
});

describe('tournament stats', () => {
  it('reads the scope and base slug of a stat key', () => {
    expect([scopeOfStatKey('points'), scopeOfStatKey('points_per_game')]).toEqual(['aggregate', 'per_game']);
    expect([baseStatSlug('points_per_game'), baseStatSlug('points')]).toEqual(['points', 'points']);
  });

  it('lists a sport table in its order, per scope, with abbreviations', () => {
    const playerStats = tournament().playerStats;
    expect(statColumnsFor('basketball_5x5', playerStats, 'aggregate')).toEqual([
      { key: 'game_played', label: 'JOG', description: 'Jogos' },
      { key: 'points', label: 'PTS', description: 'Pontos' },
      { key: 'assists', label: 'AST', description: 'Assistências' },
    ]);
    expect(statColumnsFor('basketball_5x5', playerStats, 'per_game').map((column) => column.key)).toEqual([
      'minutes_played_per_game',
      'points_per_game',
    ]);
  });

  it('keeps the public stats in API order for a sport with no table', () => {
    expect(statColumnsFor('volleyball', stats('aces', 'game_played', 'kills'), 'aggregate')).toEqual([
      { key: 'aces', label: 'T aces', description: 'T aces' },
      { key: 'kills', label: 'T kills', description: 'T kills' },
    ]);
  });

  it('lays out scopes and filters', () => {
    const layout = tournamentStatsLayout(tournament());
    expect(layout.scopes).toEqual(['aggregate', 'per_game']);
    expect(layout.phases).toEqual([{ id: 'ph1', label: 'Classificação' }, { id: 'ph2', label: 'Playoffs' }]);
    expect(layout.teams).toEqual([{ id: 'team-a', label: 'Alpha' }, { id: 'team-b', label: 'Beta' }]);
    expect(layout.minStatFilters).toEqual([{ id: 'game_played', label: 'Jogos (mín.)' }]);

    const single = tournamentStatsLayout(tournament({
      phases: [tournament().phases[0]],
      playerStats: stats('points'),
      sportSlug: 'basketball_3x3',
    }));
    expect(single.scopes).toEqual(['aggregate']);
    expect(single.phases).toEqual([]);
    expect(single.minStatFilters).toEqual([]);
    expect(tournamentStatsLayout(tournament({ sportSlug: 'other' })).minStatFilters).toEqual([]);
  });

  it('has nothing to rank without aggregated stats', () => {
    const layout = tournamentStatsLayout(tournament({ hasAggregatedPlayerStats: false }));
    expect(layout.scopes).toEqual([]);
    expect(initialStatsSelection(layout, 'points')).toBeNull();
  });

  it('opens on the requested ranking, else on points', () => {
    const layout = tournamentStatsLayout(tournament());
    expect(initialStatsSelection(layout, 'points_per_game')).toEqual({ scope: 'per_game', statKey: 'points_per_game' });
    expect(initialStatsSelection(layout, 'rebounds')).toEqual({ scope: 'aggregate', statKey: 'points' });
    expect(initialStatsSelection(layout)).toEqual({ scope: 'aggregate', statKey: 'points' });
    expect(defaultStatKey(layout, 'per_game')).toBe('points_per_game');
    expect(defaultStatKey(tournamentStatsLayout(tournament({ playerStats: stats('assists') })), 'aggregate')).toBeNull();
  });

  it('formats minutes, percentages, averages and counts', () => {
    expect(formatStatValue('minutes_played', 18754)).toBe('312');
    expect(formatStatValue('minutes_played_per_game', 2083.7)).toBe('34:43');
    expect(formatStatValue('field_goal_percentage', '75.63')).toBe('76%');
    expect(formatStatValue('points_per_game', 8.25)).toBe('8.3');
    expect(formatStatValue('points', 0)).toBe('0');
    expect(formatStatValue('points', undefined)).toBe('-');
    expect(formatStatValue('minutes_played', null)).toBe('-');
  });

  it('joins the ranking with the roster and teams, in API order', () => {
    const players = [
      { id: 'p1', name: 'Ana', photo_url: 'https://example.com/ana.png', team_id: 'team-a' },
      { id: 'p2', name: 'Bia', photo_url: null, team_id: 'team-b' },
      { id: 'p3', name: 'Cris', photo_url: null, team_id: null },
    ];
    const rows = tournamentStatsRows(
      [
        { id: 'l2', player_id: 'p2', stats: { points: 30 } },
        { id: 'lx', player_id: 'gone', stats: { points: 20 } },
        { id: 'l1', player_id: 'p1', stats: { points: 10 } },
        { id: 'l3', player_id: 'p3', stats: undefined as never },
      ],
      players,
      tournament().teams
    );
    expect(rows).toEqual([
      { playerId: 'p2', name: 'Bia', photoUrl: null, team: { id: 'team-b', name: 'Beta', logoUrl: null }, stats: { points: 30 } },
      { playerId: 'p1', name: 'Ana', photoUrl: 'https://example.com/ana.png', team: { id: 'team-a', name: 'Alpha', logoUrl: 'https://example.com/a.png' }, stats: { points: 10 } },
      { playerId: 'p3', name: 'Cris', photoUrl: null, team: null, stats: {} },
    ]);
  });
});
