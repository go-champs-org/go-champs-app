import { parseGoChampsPath } from '../goChampsLinks';

const ref = { organizationSlug: 'acme', tournamentSlug: 'liga-2026' };
const ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a1b';

describe('parseGoChampsPath', () => {
  it.each(['', '/', '//', '/?utm_source=wa'])('reads %p as the home', (path) => {
    expect(parseGoChampsPath(path)).toEqual({ kind: 'home' });
  });

  it.each(['/acme', 'acme', '/acme/'])('reads %s as the organization page', (path) => {
    expect(parseGoChampsPath(path)).toEqual({ kind: 'organization', organizationSlug: 'acme' });
  });

  it.each([
    ['/acme/liga-2026', { kind: 'tournament', ...ref }],
    ['/acme/liga-2026/', { kind: 'tournament', ...ref }],
    [`/acme/liga-2026/stage/${ID}`, { kind: 'tournament', ...ref, phaseId: ID }],
    [`/acme/liga-2026/team/${ID}`, { kind: 'team', ...ref, teamId: ID }],
    [`/acme/liga-2026/athlete/${ID}`, { kind: 'athlete', ...ref, playerId: ID }],
    [`/acme/liga-2026/game/${ID}`, { kind: 'game', ...ref, gameId: ID }],
    ['/acme/liga-2026/stats', { kind: 'stats', ...ref }],
    ['/acme/liga-2026/stats/summary', { kind: 'stats', ...ref }],
  ])('reads the public path %s', (path, expected) => {
    expect(parseGoChampsPath(path)).toEqual(expected);
  });

  it.each([
    [`/acme/liga-2026/Phase/${ID}`, { kind: 'tournament', ...ref, phaseId: ID }],
    [`/acme/liga-2026/Teams/${ID}`, { kind: 'team', ...ref, teamId: ID }],
    [`/acme/liga-2026/Player/${ID}`, { kind: 'athlete', ...ref, playerId: ID }],
    [`/acme/liga-2026/GameView/${ID}`, { kind: 'game', ...ref, gameId: ID }],
    ['/acme/liga-2026/PlayerStats', { kind: 'stats', ...ref }],
    ['/acme/liga-2026/PlayerStatsSummary', { kind: 'stats', ...ref }],
  ])('reads the legacy CMS path %s', (path, expected) => {
    expect(parseGoChampsPath(path)).toEqual(expected);
  });

  it('ignores the query and hash of a link it opens', () => {
    expect(parseGoChampsPath(`/acme/liga-2026/game/${ID}?utm_source=wa#box`)).toEqual({ kind: 'game', ...ref, gameId: ID });
  });

  it.each([
    '/About',
    '/about',
    '/Faq',
    '/Contact',
    '/SignIn',
    '/SignUp',
    '/Search',
    '/UseAsApp',
    '/TermsBR',
    '/terms',
    '/privacy',
    '/PrivacyPolicyBR',
    '/PrivacyPolicy/anything',
    '/Account',
    '/Account/settings',
    '/AccountRecovery',
    '/AccountReset',
    '/Organization/acme',
    '/Organization/acme/liga-2026',
    '/Invite/invite-1',
    '/invite/invite-1',
    '/api/search',
    '/pt/acme/liga-2026',
    '/en',
    '/logo/x.png',
    '/robots.txt',
    '/.well-known/apple-app-site-association',
  ])('leaves %s to the site', (path) => {
    expect(parseGoChampsPath(path)).toEqual({ kind: 'external', url: `https://go-champs.com${path}` });
  });

  it.each([
    '/Acme',
    '/acme/Liga',
    '/acme/liga-2026/team',
    `/acme/liga-2026/team/${ID}/extra`,
    '/acme/liga-2026/team/Not_A_Slug',
    '/acme/liga-2026/stats/other',
    '/acme/liga-2026/jogos',
    '/acme/liga-2026/unknown/thing',
    '/acme/liga-2026/PlayerStats/extra',
  ])('leaves the path %s, which no app screen matches, to the site', (path) => {
    expect(parseGoChampsPath(path)).toEqual({ kind: 'external', url: `https://go-champs.com${path}` });
  });

  it('keeps the query and hash on a link left to the site', () => {
    expect(parseGoChampsPath('/Invite/abc?x=1#y')).toEqual({
      kind: 'external',
      url: 'https://go-champs.com/Invite/abc?x=1#y',
    });
  });

  it('normalizes the leading and trailing slashes of a link left to the site', () => {
    expect(parseGoChampsPath('About/')).toEqual({ kind: 'external', url: 'https://go-champs.com/About' });
  });
});
