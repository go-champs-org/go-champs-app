import {
  AthleteMembership,
  AthleteProfile,
  AthleteRecentGame,
  AthleteTeamGame,
} from '../../domain/repositories/AthleteProfileRepository';

export const copa = { id: 'copa', name: 'Copa Central', slug: 'copa-central' };
export const liga = { id: 'liga', name: 'Liga Norte', slug: 'liga-norte' };

const alpha = { id: 'team-a', name: 'Alpha' };
const beta = { id: 'team-b', name: 'Beta' };

export const teamGame = (overrides: Partial<AthleteTeamGame> = {}): AthleteTeamGame => ({
  id: 'g1',
  datetime: '2026-11-12T19:30:00Z',
  location: 'Ginásio Central',
  city: 'São Paulo',
  court: '1',
  is_finished: false,
  live_state: 'not_started',
  home_score: null,
  away_score: null,
  home_team: alpha,
  away_team: beta,
  tournament: copa,
  athlete_team_id: 'team-a',
  ...overrides,
});

export const recentGame = (
  overrides: Partial<AthleteRecentGame['game']> = {},
  rest: Partial<Omit<AthleteRecentGame, 'game'>> = {}
): AthleteRecentGame => ({
  game: {
    id: 'r1',
    datetime: '2026-11-07T19:00:00Z',
    home_team: alpha,
    home_score: 84,
    away_team: beta,
    away_score: 76,
    tournament: { ...copa, sport_slug: 'basketball_5x5' },
    ...overrides,
  },
  athlete_team_id: 'team-a',
  result: 'win',
  stats: { points: 28, rebounds: 8, assists: 6, minutes_played: 1920 },
  ...rest,
});

export const membership = (overrides: Partial<AthleteMembership> = {}): AthleteMembership => ({
  tournament: {
    ...copa,
    logo_url: null,
    sport_slug: 'basketball_5x5',
    sport_name: 'Basketball 5x5',
    organization: { id: 'org-1', name: 'Federação Paulista', slug: 'fpb' },
  },
  team: { ...alpha, logo_url: null, tri_code: 'ALP' },
  shirt_number: '7',
  ...overrides,
});

export const athleteProfile = (overrides: Partial<AthleteProfile> = {}): AthleteProfile => ({
  id: 'a1',
  username: 'ana',
  name: 'Ana Silva',
  photo_url: null,
  facebook: null,
  instagram: '@ana',
  twitter: null,
  memberships: [membership()],
  career_stats: [],
  ...overrides,
});
