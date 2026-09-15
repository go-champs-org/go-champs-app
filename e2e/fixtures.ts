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
      else if (path === '/accounts/signin') payload = { data: { email: 'ana@example.com', token: 'token', username: 'ana' } };
      else if (path.startsWith('/users/')) payload = {
        data: {
          email: 'ana@example.com',
          username: 'ana',
          organizations: [{ id: 'org-1', name: 'Org Ana', slug: 'org-ana', logo_url: null }],
        },
      };
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
