import { test as base, expect } from '@playwright/test';
import { classificationDataFixture, gamesFixture, groupPhaseDataFixture, tournamentDetailsFixture, tournamentFixture, tournamentHistoryFixture } from '../src/test/fixtures/tournamentFixtures';

export const phase = (id: string, title: string, type = 'elimination') => ({ id, title, type, elimination_stats: [] });
export const phases = [phase('table', 'Classificação'), phase('groups', 'Grupos'), phase('draw', 'Playoffs', 'draw')];
export const tournaments = ['Copa Completa', 'Copa Classificação', 'Copa Grupos', 'Copa Playoffs', 'Copa Sem Fases'].map((name, index) => ({
  ...tournamentFixture, id: `t-${index}`, name,
}));
const selectedPhases = [phases, [phases[0]], [phases[1]], [phases[2]], []];
const logo = 'https://example.com/alpha.png';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://example.com/**', (route) => route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfXkAAAAASUVORK5CYII=', 'base64'),
    }));
    await page.route(/https:\/\/(api\.go-champs\.com|go-champs-api-staging\.herokuapp\.com)\//, async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace(/^\/v1/, '');
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      let payload: unknown;
      if (path === '/recently-view') payload = { data: tournaments.map((tournament) => ({ tournament })) };
      else if (path.startsWith('/tournaments/')) {
        const index = tournaments.findIndex((tournament) => path.endsWith('/' + tournament.id));
        payload = { data: { ...tournamentHistoryFixture.data, ...tournamentDetailsFixture, ...tournaments[index], phases: selectedPhases[index] } };
      } else if (path === '/phases/table') payload = { data: classificationDataFixture };
      else if (path === '/phases/groups') payload = { data: groupPhaseDataFixture };
      else if (path === '/phases/draw') payload = { data: { draws: [{ id: 'final', title: 'Final', order: 1, matches: [{
        id: 'match', name: 'Decisão', first_team_id: 'team-a', second_team_id: 'team-b', first_team_score: '10', second_team_score: '8',
      }] }] } };
      else if (path === '/games') payload = { data: gamesFixture.map((game) => ({ ...game, phase_id: url.searchParams.get('where[phase_id]'), home_team: { ...game.home_team!, logo_url: logo }, away_team: { ...game.away_team!, logo_url: logo } })) };
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
      else if (path === '/accounts/signin') payload = { data: { email: 'ana@example.com', token: 'token', username: 'ana' } };
      else if (path.startsWith('/users/')) payload = {
        data: {
          email: 'ana@example.com',
          username: 'ana',
          organizations: [{ id: 'org-1', name: 'Org Ana', slug: 'org-ana', logo_url: null }],
        },
      };
      else if (path.startsWith('/athlete-profiles/username/') && route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON?.() as { athlete_profile?: { name?: string; instagram?: string } } | null;
        payload = {
          data: {
            id: 'athlete-1',
            username: 'ana',
            name: body?.athlete_profile?.name || 'Ana Silva',
            photo_url: null,
            facebook: null,
            instagram: body?.athlete_profile?.instagram || null,
            twitter: null,
          },
        };
      }
      else if (path.startsWith('/athlete-profiles/username/')) payload = {
        data: {
          id: 'athlete-1',
          username: 'ana',
          name: 'Ana Silva',
          photo_url: null,
          facebook: null,
          instagram: null,
          twitter: null,
          tournaments: [],
          career_stats: [],
        },
      };
      else if (path === '/athlete-profiles' && route.request().method() === 'POST') payload = {
        data: {
          id: 'athlete-1',
          username: 'ana',
          name: 'Ana Silva',
          photo_url: null,
          facebook: null,
          instagram: null,
          twitter: null,
        },
      };
      else if (path === '/athlete-profiles/me/schedules') payload = {
        data: [{
          id: 'game-1',
          datetime: '2026-09-20T19:00:00.000Z',
          location: 'Ginásio Central',
          city: 'São Paulo',
          court: '1',
          is_finished: false,
          live_state: null,
          home_score: null,
          away_score: null,
          home_team: { id: 'team-a', name: 'Alpha', logo_url: logo },
          away_team: { id: 'team-b', name: 'Beta', logo_url: logo },
          tournament: { id: 't-0', name: 'Copa Completa', slug: 'copa-completa' },
        }],
      };
      else throw new Error(`Unexpected API call: ${url}`);
      await route.fulfill({ json: payload, headers: { 'access-control-allow-origin': '*' } });
    });
    await use(page);
  },
});

export { expect };
