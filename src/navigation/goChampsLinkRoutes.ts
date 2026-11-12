import type { PartialState, NavigationState } from '@react-navigation/native';
import { parseGoChampsPath } from '../core/linking/goChampsLinks';
import { ResolvedGoChampsLink } from '../domain/usecases/ResolveGoChampsLinkUseCase';
import { RootStackParamList } from './types';

// The prefixes of the links the app opens on iOS and Android. The site's own
// domain (universal links / App Links) and the app's scheme.
export const GO_CHAMPS_LINK_PREFIXES = ['https://go-champs.com', 'gochamps://'];

type ScreenRoute = {
  [Name in keyof RootStackParamList]: { name: Name; params: RootStackParamList[Name] };
}[keyof RootStackParamList];

/** The screen a resolved link opens; null for the ones that leave the app. */
export const routeForResolvedLink = (resolved: ResolvedGoChampsLink): ScreenRoute | null => {
  switch (resolved.kind) {
    case 'home':
      return { name: 'MainTabs', params: { screen: 'HomeTab' } };
    case 'organization':
      return { name: 'OrganizationScreen', params: { organizationSlug: resolved.organizationSlug } };
    case 'tournament':
      return {
        name: 'TournamentScreen',
        params: { tournamentId: resolved.tournamentId, phaseId: resolved.phaseId, apiBaseUrl: resolved.apiBaseUrl },
      };
    case 'stats':
      return { name: 'TournamentStatsScreen', params: { tournamentId: resolved.tournamentId, apiBaseUrl: resolved.apiBaseUrl } };
    case 'team':
      return {
        name: 'TeamScreen',
        params: { tournamentId: resolved.tournamentId, teamId: resolved.teamId, apiBaseUrl: resolved.apiBaseUrl },
      };
    case 'athlete':
      return {
        name: 'AthleteScreen',
        params: { tournamentId: resolved.tournamentId, playerId: resolved.playerId, apiBaseUrl: resolved.apiBaseUrl },
      };
    case 'game':
      return { name: 'GameDetailScreen', params: { gameId: resolved.gameId } };
    case 'external':
    case 'notFound':
      return null;
  }
};

type LinkState = PartialState<NavigationState<RootStackParamList>>;

/**
 * The navigation state for a go-champs.com path (React Navigation's
 * `getStateFromPath` on iOS and Android). The home opens on the tabs; any other
 * link opens GoChampsLinkScreen above them, which resolves it and replaces
 * itself with its screen, so going back lands on the home.
 */
export const stateForGoChampsPath = (path: string): LinkState => {
  const tabs = { name: 'MainTabs' as const };
  if (parseGoChampsPath(path).kind === 'home') return { routes: [tabs] };
  return { routes: [tabs, { name: 'GoChampsLinkScreen', params: { path } }] };
};
