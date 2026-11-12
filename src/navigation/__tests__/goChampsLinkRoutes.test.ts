import { routeForResolvedLink, stateForGoChampsPath } from '../goChampsLinkRoutes';

const API = 'https://api.test/v1';

describe('routeForResolvedLink', () => {
  it.each([
    [{ kind: 'home' }, { name: 'MainTabs', params: { screen: 'HomeTab' } }],
    [{ kind: 'organization', organizationSlug: 'acme' }, { name: 'OrganizationScreen', params: { organizationSlug: 'acme' } }],
    [
      { kind: 'tournament', tournamentId: 't1', apiBaseUrl: API },
      { name: 'TournamentScreen', params: { tournamentId: 't1', phaseId: undefined, apiBaseUrl: API } },
    ],
    [
      { kind: 'tournament', tournamentId: 't1', phaseId: 'p1', apiBaseUrl: API },
      { name: 'TournamentScreen', params: { tournamentId: 't1', phaseId: 'p1', apiBaseUrl: API } },
    ],
    [
      { kind: 'stats', tournamentId: 't1', apiBaseUrl: API },
      { name: 'TournamentStatsScreen', params: { tournamentId: 't1', apiBaseUrl: API } },
    ],
    [
      { kind: 'team', tournamentId: 't1', teamId: 'team-1', apiBaseUrl: API },
      { name: 'TeamScreen', params: { tournamentId: 't1', teamId: 'team-1', apiBaseUrl: API } },
    ],
    [
      { kind: 'athlete', tournamentId: 't1', playerId: 'p1', apiBaseUrl: API },
      { name: 'AthleteScreen', params: { tournamentId: 't1', playerId: 'p1', apiBaseUrl: API } },
    ],
    [{ kind: 'game', gameId: 'g1' }, { name: 'GameDetailScreen', params: { gameId: 'g1' } }],
  ] as const)('opens %p on its screen', (resolved, expected) => {
    expect(routeForResolvedLink(resolved)).toEqual(expected);
  });

  it.each([
    { kind: 'external', url: 'https://go-champs.com/About' },
    { kind: 'notFound', url: 'https://go-champs.com/acme/missing' },
  ] as const)('opens no screen for %p', (resolved) => {
    expect(routeForResolvedLink(resolved)).toBeNull();
  });
});

describe('stateForGoChampsPath', () => {
  it('opens the home on the tabs alone', () => {
    expect(stateForGoChampsPath('/')).toEqual({ routes: [{ name: 'MainTabs' }] });
  });

  it.each(['/acme/liga/team/team-1', '/About'])('opens %s on the link screen above the tabs', (path) => {
    expect(stateForGoChampsPath(path)).toEqual({
      routes: [{ name: 'MainTabs' }, { name: 'GoChampsLinkScreen', params: { path } }],
    });
  });
});
