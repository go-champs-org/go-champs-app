import { StatScope } from './statLeaders';
import { StatColumn, statColumnsFor } from './tournamentStats';
import type { TournamentOverview } from '../GetTournamentOverviewUseCase';

// The tournament athlete page of the public site
// (go-champs-web apps/public/app/[locale]/[org]/[tournament]/athlete/[playerId]).
// Every number comes from the API's aggregated stats — totals, per-game
// averages and percentages alike — so the athlete reads exactly as the
// tournament stats screen ranks them.

const GAMES_SLUG = 'game_played';

// The tournament stats screen's columns, minus the games played, which the
// table carries as its own JG column.
export const athleteStatColumns = (
  sportSlug: string,
  playerStats: TournamentOverview['playerStats'],
  scope: StatScope
): StatColumn[] => statColumnsFor(sportSlug, playerStats, scope).filter((column) => !column.key.startsWith(GAMES_SLUG));

// The banner's line under the name.
export const gamesPlayedText = (games: number): string =>
  games === 1 ? '1 jogo disputado' : games > 1 ? `${games} jogos disputados` : '';

export type SocialNetwork = 'instagram' | 'twitter' | 'facebook';
export type SocialLink = { network: SocialNetwork; url: string };

const NETWORK_HOSTS: Record<SocialNetwork, string> = {
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
  facebook: 'https://facebook.com',
};

const NETWORKS: SocialNetwork[] = ['instagram', 'twitter', 'facebook'];

// A handle is stored however it was typed: with or without the @.
export const athleteSocialLinks = (handles: Partial<Record<SocialNetwork, string | null>>): SocialLink[] =>
  NETWORKS.map((network) => ({ network, handle: (handles[network] ?? '').trim().replace(/^@/, '') }))
    .filter(({ handle }) => handle !== '')
    .map(({ network, handle }) => ({ network, url: `${NETWORK_HOSTS[network]}/${handle}` }));
