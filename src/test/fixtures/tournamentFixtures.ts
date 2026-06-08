import { ClassificationData } from '../../models/ClassificationModel';
import { Game } from '../../models/GameModel';
import { GroupPhaseData } from '../../models/GroupPhaseModel';
import { PlayoffResponse } from '../../models/PlayoffModel';
import { Tournament } from '../../models/Tournament';
import { TournamentDetails } from '../../models/TournamentDetails';
import { TournamentHistory } from '../../models/TournamentHistory';

export const tournamentFixture: Tournament = {
  id: 'tournament-1',
  name: 'Copa Go Champs',
  slug: 'copa-go-champs',
  organization: {
    id: 'org-1',
    name: 'Go Champs',
    slug: 'go-champs',
  },
};

const teamA = {
  id: 'team-a',
  name: 'Alpha',
  logo_url: 'https://example.com/alpha.png',
  players: [],
  tri_code: 'ALP',
};

const teamB = {
  id: 'team-b',
  name: 'Beta',
  logo_url: null,
  players: [],
  tri_code: 'BET',
};

export const gamesFixture: Game[] = [
  {
    id: 'game-2',
    phase_id: 'phase-playoff',
    datetime: '2026-01-02T10:00:00.000Z',
    location: 'Court 2',
    home_team: teamB,
    away_team: teamA,
    home_score: 8,
    away_score: 12,
    home_placeholder: null,
    away_placeholder: null,
    is_finished: true,
    live_state: 'ended',
    live_started_at: null,
    live_ended_at: null,
    youtube_code: null,
    info: null,
    referee: null,
    attendance: null,
  },
  {
    id: 'game-1',
    phase_id: 'phase-playoff',
    datetime: '2026-01-01T10:00:00.000Z',
    location: 'Court 1',
    home_team: teamA,
    away_team: teamB,
    home_score: 10,
    away_score: 8,
    home_placeholder: null,
    away_placeholder: null,
    is_finished: true,
    live_state: 'ended',
    live_started_at: null,
    live_ended_at: null,
    youtube_code: null,
    info: null,
    referee: null,
    attendance: null,
  },
];

export const tournamentDetailsFixture: TournamentDetails = {
  ...tournamentFixture,
  phases: [
    {
      id: 'phase-playoff',
      title: 'Playoffs',
      type: 'draw',
    },
  ],
  sport_slug: 'basketball',
  sport_name: 'Basketball',
  teams: [teamA, teamB],
};

export const tournamentHistoryFixture: TournamentHistory = {
  data: {
    facebook: '',
    has_aggregated_player_stats: false,
    id: tournamentFixture.id,
    instagram: '',
    name: tournamentFixture.name,
    organization: tournamentFixture.organization,
    phases: [],
    player_stats: [],
    players: [],
    registrations: [],
    scoreboard_setting: '',
    site_url: '',
    slug: tournamentFixture.slug,
    sport_name: 'Basketball',
    sport_slug: 'basketball',
    team_stats: [],
    teams: [],
    twitter: '',
    visibility: 'public',
  },
};

export const playoffResponseFixture: PlayoffResponse = {
  data: {
    draws: [
      {
        id: 'draw-2',
        title: 'Final',
        order: 2,
        matches: [],
      },
      {
        id: 'draw-1',
        title: 'Semifinal',
        order: 1,
        matches: [],
      },
    ],
  },
};

export const classificationDataFixture: ClassificationData = {
  id: 'phase-classification',
  title: 'Classificacao',
  type: 'classification',
  is_in_progress: false,
  order: 1,
  elimination_stats: [
    {
      id: 'wins',
      title: 'V',
      team_stat_source: 'manual',
      ranking_order: 1,
    },
  ],
  eliminations: [
    {
      id: 'classification',
      title: null,
      order: 1,
      info: null,
      team_stats: [
        {
          id: 'stat-a',
          team_id: 'team-a',
          placeholder: null,
          stats: { wins: 1 },
        },
        {
          id: 'stat-b',
          team_id: 'team-b',
          placeholder: null,
          stats: { wins: 3 },
        },
      ],
    },
  ],
};

export const groupPhaseDataFixture: GroupPhaseData = {
  ...classificationDataFixture,
  id: 'phase-group',
  title: 'Grupo A',
  type: 'group',
  eliminations: [
    {
      ...classificationDataFixture.eliminations[0],
      id: 'group-a',
      title: 'Grupo A',
      order: 2,
    },
    {
      ...classificationDataFixture.eliminations[0],
      id: 'group-b',
      title: 'Grupo B',
      order: 1,
    },
  ],
};

