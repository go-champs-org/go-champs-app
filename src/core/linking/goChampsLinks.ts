// Links to go-champs.com that the app opens itself (universal links on iOS,
// App Links on Android). Mirrors the site's edge routing table
// (go-champs-web apps/cms/src/EdgeRouting/routes.ts): the public paths of
// apps/public and the legacy CMS paths still found in shared links.
//
// Anything the app has no screen for comes back as `external`, so the caller
// opens it on the site instead.

export const GO_CHAMPS_ORIGIN = 'https://go-champs.com';

type TournamentRef = { organizationSlug: string; tournamentSlug: string };

export type GoChampsLink =
  | { kind: 'home' }
  | { kind: 'organization'; organizationSlug: string }
  | ({ kind: 'tournament'; phaseId?: string } & TournamentRef)
  | ({ kind: 'stats' } & TournamentRef)
  | ({ kind: 'team'; teamId: string } & TournamentRef)
  | ({ kind: 'athlete'; playerId: string } & TournamentRef)
  | ({ kind: 'game'; gameId: string } & TournamentRef)
  // A team roster invite (`/Invite/:id`), answered in the app.
  | { kind: 'invite'; inviteId: string }
  | { kind: 'external'; url: string };

// Same shape as the edge table's SLUG: organization and tournament slugs, and
// the UUIDs of sub-routes.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// First segments that are never an organization slug: the CMS's static routes
// (CMS_RESERVED_SEGMENTS), apps/public's own pages and asset folders, and the
// legacy locale prefixes. Compared ignoring case, so a link the site would not
// route to a tournament never reaches the tournament lookup either.
const RESERVED_FIRST_SEGMENTS = new Set(
  [
    'About',
    'Account',
    'AccountRecovery',
    'AccountReset',
    'Contact',
    'Faq',
    'Invite',
    'Organization',
    'Search',
    'SignIn',
    'SignUp',
    'TermsBR',
    'UseAsApp',
    'privacy',
    'terms',
    'api',
    'logo',
    'photos',
    'illustrations',
    'fonts',
    'pt',
    'en',
  ].map((segment) => segment.toLowerCase())
);

const isReserved = (segment: string): boolean => {
  const lower = segment.toLowerCase();
  // The CMS declares PrivacyPolicy with a trailing `*`.
  return RESERVED_FIRST_SEGMENTS.has(lower) || lower.startsWith('privacypolicy');
};

const isSlug = (segment: string | undefined): segment is string => !!segment && SLUG.test(segment);

// Tournament sub-pages, new (apps/public) and legacy (CMS) names.
const toSubpage = (
  ref: TournamentRef,
  segments: string[]
): GoChampsLink | null => {
  const [page, id, ...rest] = segments;

  if (page === undefined) return { kind: 'tournament', ...ref };

  if (rest.length === 0 && id !== undefined && isSlug(id)) {
    switch (page) {
      case 'stage':
      case 'Phase':
        return { kind: 'tournament', ...ref, phaseId: id };
      case 'team':
      case 'Teams':
        return { kind: 'team', ...ref, teamId: id };
      case 'athlete':
      case 'Player':
        return { kind: 'athlete', ...ref, playerId: id };
      case 'game':
      case 'GameView':
        return { kind: 'game', ...ref, gameId: id };
      case 'stats':
        return id === 'summary' ? { kind: 'stats', ...ref } : null;
      default:
        return null;
    }
  }

  if (id === undefined && ['stats', 'PlayerStats', 'PlayerStatsSummary'].includes(page)) {
    return { kind: 'stats', ...ref };
  }

  return null;
};

const splitPath = (path: string): { pathname: string; suffix: string } => {
  const index = path.search(/[?#]/);
  return index === -1
    ? { pathname: path, suffix: '' }
    : { pathname: path.slice(0, index), suffix: path.slice(index) };
};

/**
 * The app destination for a go-champs.com path, with or without its leading
 * slash, query or hash (e.g. `/acme/liga-2026/team/<id>?ref=wa`).
 */
export const parseGoChampsPath = (path: string): GoChampsLink => {
  const { pathname, suffix } = splitPath(path);
  const normalized = `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  const external: GoChampsLink = { kind: 'external', url: `${GO_CHAMPS_ORIGIN}${normalized}${suffix}` };

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) return { kind: 'home' };

  const [organizationSlug, tournamentSlug, ...rest] = segments;
  if (organizationSlug.toLowerCase() === 'invite') {
    return rest.length === 0 && isSlug(tournamentSlug) ? { kind: 'invite', inviteId: tournamentSlug } : external;
  }
  if (isReserved(organizationSlug) || !isSlug(organizationSlug)) return external;

  if (tournamentSlug === undefined) return { kind: 'organization', organizationSlug };
  if (!isSlug(tournamentSlug)) return external;

  return toSubpage({ organizationSlug, tournamentSlug }, rest) ?? external;
};
