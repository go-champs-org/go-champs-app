import { test as base, expect } from '@playwright/test';
import { classificationDataFixture, gamesFixture, groupPhaseDataFixture, tournamentDetailsFixture, tournamentFixture, tournamentHistoryFixture } from '../src/test/fixtures/tournamentFixtures';

export const phase = (id: string, title: string, type = 'elimination') => ({ id, title, type, elimination_stats: [] });
export const phases = [phase('table', 'Classificação'), phase('groups', 'Grupos'), phase('draw', 'Playoffs', 'draw')];
export const tournaments = ['Copa Completa', 'Copa Classificação', 'Copa Grupos', 'Copa Playoffs', 'Copa Sem Fases'].map((name, index) => ({
  ...tournamentFixture, id: `t-${index}`, name,
}));
const selectedPhases = [phases, [phases[0]], [phases[1]], [phases[2]], []];
const logo = 'https://example.com/alpha.png';
export const otherOrganization = { id: 'org-2', name: 'Liga Norte', slug: 'liga-norte', logo_url: null };
const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const athleteNames: Record<string, string> = { 'player-a': 'Ana Silva', 'player-b': 'Bia Souza' };
export const storageUploadUrl = 'https://storage.example.test/uploads/foto.jpg?signature=1';
export const uploadedPhotoUrl = 'https://example.com/media/athlete-profiles-photos/uploads/foto.jpg';
export const accountIdentity = {
  id: 'identity-1',
  account_id: 'account-1',
  full_legal_name: 'Ana Maria Silva',
  tax_id_type: 'CPF',
  tax_id_last4: '4725',
  government_id_type: null,
  government_id_last4: null,
  date_of_birth: '1997-05-21',
};
type IdentityWrite = { account_identity?: Record<string, string | null | undefined> };
const writtenIdentity = (body: IdentityWrite | null, base: typeof accountIdentity | null) => {
  const write = body?.account_identity ?? {};
  const current = base ?? { ...accountIdentity, full_legal_name: null, tax_id_type: null, tax_id_last4: null, date_of_birth: null };
  return {
    ...current,
    ...('full_legal_name' in write ? { full_legal_name: write.full_legal_name } : {}),
    ...(write.tax_id ? { tax_id_type: 'CPF', tax_id_last4: write.tax_id.slice(-4) } : {}),
    ...(write.government_id ? { government_id_type: 'RG', government_id_last4: write.government_id.replace(/[^0-9a-zA-Z]/g, '').slice(-4) } : {}),
    ...('date_of_birth' in write ? { date_of_birth: write.date_of_birth } : {}),
  };
};

const copaCompleta = { id: 't-0', name: 'Copa Completa', slug: 'copa-completa' };
const copaClassificacao = { id: 't-1', name: 'Copa Classificação', slug: 'copa-classificacao' };
type FixtureTeam = { id: string; name: string; logo_url: string; tri_code: string | null };
const alphaTeam: FixtureTeam = { id: 'team-a', name: 'Alpha', logo_url: logo, tri_code: 'ALP' };
const betaTeam: FixtureTeam = { id: 'team-b', name: 'Beta', logo_url: logo, tri_code: 'BET' };
// Gama has no tri code, so the cards show its name.
const gammaTeam: FixtureTeam = { id: 'team-c', name: 'Gama', logo_url: logo, tri_code: null };

// The athlete's own team games (far ahead, so they stay upcoming) and results.
const teamGame = (id: string, datetime: string, tournament: typeof copaCompleta, home = alphaTeam, away = betaTeam) => ({
  id, datetime, location: 'Ginásio Central', city: 'São Paulo', court: '1', number: null, assigned_officials: [],
  is_finished: false, live_state: 'not_started', phase_id: 'table',
  home_team: home, home_placeholder: null, home_score: null, away_team: away, away_placeholder: null, away_score: null,
  tournament: { ...tournament, logo_url: null, organization: null, sponsors: [] }, athlete_team_id: 'team-a',
});
export const athleteTeamGames = [
  teamGame('game-next', '2099-03-12T19:30:00Z', copaCompleta),
  teamGame('game-later', '2099-03-15T18:00:00Z', copaClassificacao, gammaTeam, alphaTeam),
];
const recent = (id: string, datetime: string, tournament: typeof copaCompleta, scores: [number, number], result: string, points: number) => ({
  game: { id, datetime, home_team: alphaTeam, home_placeholder: null, home_score: scores[0], away_team: betaTeam, away_placeholder: null,
    away_score: scores[1], tournament: { ...tournament, sport_slug: 'basketball_5x5', organization: null } },
  athlete_team_id: 'team-a', result, stats: { points, rebounds: 8, assists: 6, minutes_played: 1920 },
});
export const athleteRecentGames = [
  recent('game-won', '2026-11-07T19:00:00Z', copaCompleta, [84, 76], 'win', 28),
  recent('game-lost', '2026-11-04T19:00:00Z', copaClassificacao, [71, 78], 'loss', 21),
];
export const athleteMemberships = [copaCompleta, copaClassificacao].map((tournament, index) => ({
  tournament: { ...tournament, logo_url: index === 0 ? logo : null, sport_slug: 'basketball_5x5', sport_name: 'Basketball 5x5',
    organization: { id: 'org-1', name: 'Federação Paulista', slug: 'fpb' } },
  team: { id: 'team-a', name: 'Alpha', logo_url: logo, tri_code: 'ALP' },
  shirt_number: index === 0 ? '7' : null,
}));
export const athleteCareer = [{
  sport_slug: 'basketball_5x5', sport_name: 'Basketball 5x5', tournaments_count: 2,
  stats: { game_played: 12, points: 257, points_per_game: 21.4, rebounds: 82, rebounds_per_game: 6.8, assists: 50, assists_per_game: 4.2 },
}];

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://example.com/**', (route) => route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfXkAAAAASUVORK5CYII=', 'base64'),
    }));
    // Presigned R2 upload (cross-origin PUT, so it is preflighted).
    await page.route('https://storage.example.test/**', (route) => route.fulfill({
      status: route.request().method() === 'OPTIONS' ? 204 : 200,
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'PUT' },
    }));
    await page.route(/https:\/\/(api\.go-champs\.com|go-champs-api-staging\.herokuapp\.com)\//, async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/v1/, '');
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      let payload: unknown;
      if (path === '/recently-view') payload = { data: tournaments.map((tournament) => ({ tournament })) };
      else if (path === '/search') {
        const term = searchable(url.searchParams.get('term') || '');
        payload = { data: tournaments.filter((tournament) => searchable(`${tournament.name} ${tournament.organization.name}`).includes(term)) };
      } else if (path === '/organizations/recently-viewed') payload = {
        data: [{ organization: { ...tournamentFixture.organization, logo_url: logo } }],
      };
      else if (path === '/organizations' && !url.searchParams.has('where[slug]')) payload = {
        data: [{ ...tournamentFixture.organization, logo_url: logo }, otherOrganization],
      };
      else if (path === '/organizations') payload = {
        data: url.searchParams.get('where[slug]') === tournamentFixture.organization.slug
          ? [{ ...tournamentFixture.organization, logo_url: logo }]
          : [],
      };
      else if (path === '/tournaments') payload = {
        data: url.searchParams.get('where[organization_slug]') === tournamentFixture.organization.slug
          ? tournaments.map((tournament, index) => ({ ...tournament, logo_url: index === 0 ? logo : null }))
          : [],
      };
      else if (path.startsWith('/tournaments/')) {
        const index = tournaments.findIndex((tournament) => path.endsWith('/' + tournament.id));
        payload = { data: { ...tournamentHistoryFixture.data, ...tournamentDetailsFixture, ...tournaments[index], phases: selectedPhases[index] } };
      } else if (path === '/phases/table') payload = { data: classificationDataFixture };
      else if (path === '/phases/groups') payload = { data: groupPhaseDataFixture };
      else if (path === '/phases/draw') payload = { data: { draws: [{ id: 'final', title: 'Final', order: 1, matches: [{
        id: 'match', name: 'Decisão', first_team_id: 'team-a', second_team_id: 'team-b', first_team_score: '10', second_team_score: '8',
      }] }] } };
      else if (path === '/games') payload = { data: gamesFixture.map((game) => ({ ...game, phase_id: url.searchParams.get('where[phase_id]'), home_team: { ...game.home_team!, logo_url: logo }, away_team: { ...game.away_team!, logo_url: logo } })) };
      else if (path === '/aggregated-player-stats-by-tournament') payload = { data: [] };
      else if (path.startsWith('/sports/')) payload = { data: { slug: 'basketball', name: 'Basquete' } };
      else if (path.startsWith('/games/')) {
        const gameId = path.split('/')[2];
        const base = gamesFixture.find((game) => game.id === gameId) || gamesFixture[0];
        payload = {
          data: {
            ...base,
            id: gameId,
            city: 'São Paulo',
            court: '1',
            number: '1',
            result_type: 'automatic',
            assets: [
              { id: 'asset-1', type: 'fiba-boxscore', url: 'https://example.com/boxscore.pdf' },
            ],
            officials: [],
            web_url: null,
            phase: {
              id: 'table',
              title: 'Classificação',
              type: 'elimination',
              tournament: { id: 't-1', name: 'Copa Classificação', slug: 'copa' },
            },
            home_team: {
              ...base.home_team,
              logo_url: logo,
              players: [{ id: 'player-a', name: 'Ana Silva', shirt_number: '5' }],
            },
            away_team: {
              ...base.away_team,
              logo_url: logo,
              players: [{ id: 'player-b', name: 'Bia Costa', shirt_number: '10' }],
            },
          },
        };
      }
      else if (path.startsWith('/players/')) {
        const id = path.split('/')[2];
        payload = { data: { id, name: athleteNames[id] || 'Atleta', team_id: 'team-a', photo_url: null, instagram: '@anasilva' } };
      }
      else if (path === '/player-stats-logs') payload = {
        data: [{
          id: 'log-1',
          game_id: url.searchParams.get('where[game_id]') || 'game-1',
          phase_id: 'table',
          player_id: 'player-a',
          team_id: 'team-a',
          tournament_id: 't-1',
          stats: {
            minutes_played: '2070',
            points: '20',
            rebounds: '5',
            assists: '3',
            blocks: '1',
            steals: '2',
            turnovers: '1',
            efficiency: '25',
            plus_minus: '4',
            free_throws_made: '2',
            free_throws_attempted: '2',
            free_throw_percentage: '100',
            field_goals_made: '4',
            field_goals_attempted: '8',
            field_goal_percentage: '50',
            three_point_field_goals_made: '2',
            three_point_field_goals_attempted: '4',
            three_point_field_goal_percentage: '50',
            game_played: '1',
          },
        }],
      };
      else if (path === '/team-stats-logs') payload = {
        data: [{ id: 'team-log-1', game_id: url.searchParams.get('where[game_id]') || 'game-1', team_id: 'team-a', stats: { points: '20' } }],
      };
      else if (path === '/accounts/signin') payload = { data: { email: 'ana@example.com', token: 'token', username: 'ana' } };
      else if (path.startsWith('/users/')) payload = {
        data: {
          email: 'ana@example.com',
          username: 'ana',
          organizations: [{ id: 'org-1', name: 'Org Ana', slug: 'org-ana', logo_url: null }],
        },
      };
      else if (path.startsWith('/athlete-profiles/username/') && route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON?.() as { athlete_profile?: Record<string, string | null> } | null;
        payload = {
          data: {
            id: 'athlete-1',
            username: 'ana',
            name: body?.athlete_profile?.name || 'Ana Silva',
            photo_url: body?.athlete_profile?.photo_url ?? null,
            facebook: body?.athlete_profile?.facebook ?? null,
            instagram: body?.athlete_profile?.instagram ?? null,
            twitter: body?.athlete_profile?.twitter ?? null,
          },
        };
      }
      else if (path === '/account-identity' && route.request().method() === 'GET') payload = { data: accountIdentity };
      else if (path === '/account-identity' && route.request().method() === 'PUT') {
        payload = { data: writtenIdentity(route.request().postDataJSON() as IdentityWrite, accountIdentity) };
      }
      else if (path === '/account-identity' && route.request().method() === 'POST') {
        payload = { data: writtenIdentity(route.request().postDataJSON() as IdentityWrite, null) };
      }
      else if (path === '/upload/presigned-url') payload = {
        data: { filename: 'foto.jpg', url: storageUploadUrl, public_url: uploadedPhotoUrl },
      };
      else if (/^\/athlete-profiles\/username\/[^/]+\/schedules$/.test(path)) payload = { data: athleteTeamGames };
      else if (/^\/athlete-profiles\/username\/[^/]+\/recent-games$/.test(path)) payload = { data: athleteRecentGames };
      else if (path.startsWith('/athlete-profiles/username/')) payload = {
        data: {
          id: 'athlete-1',
          username: 'ana',
          name: 'Ana Silva',
          photo_url: null,
          facebook: null,
          instagram: '@anasilva',
          twitter: null,
          tournaments: [],
          memberships: athleteMemberships,
          career_stats: athleteCareer,
        },
      };
      else if (path === '/athlete-profiles' && route.request().method() === 'POST') {
        const body = route.request().postDataJSON?.() as { athlete_profile?: Record<string, string | null> } | null;
        payload = {
          data: {
            id: 'athlete-1',
            username: 'ana',
            name: body?.athlete_profile?.name || 'Ana Silva',
            photo_url: body?.athlete_profile?.photo_url ?? null,
            facebook: body?.athlete_profile?.facebook ?? null,
            instagram: body?.athlete_profile?.instagram ?? null,
            twitter: body?.athlete_profile?.twitter ?? null,
          },
        };
      }
      else throw new Error(`Unexpected API call: ${url}`);
      await route.fulfill({ json: payload, headers: { 'access-control-allow-origin': '*' } });
    });
    await use(page);
  },
});

export { expect };
