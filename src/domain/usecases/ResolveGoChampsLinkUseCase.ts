import { GO_CHAMPS_ORIGIN, GoChampsLink, parseGoChampsPath } from '../../core/linking/goChampsLinks';
import { TournamentRepository } from '../repositories/TournamentRepository';

type InTournament = { tournamentId: string; apiBaseUrl?: string };

// Where a go-champs.com link lands in the app, with the tournament its slugs
// name already looked up.
export type ResolvedGoChampsLink =
  | { kind: 'home' }
  | { kind: 'organization'; organizationSlug: string }
  | ({ kind: 'tournament'; phaseId?: string } & InTournament)
  | ({ kind: 'stats' } & InTournament)
  | ({ kind: 'team'; teamId: string } & InTournament)
  | ({ kind: 'athlete'; playerId: string } & InTournament)
  | { kind: 'game'; gameId: string }
  | { kind: 'invite'; inviteId: string }
  // The app has no screen for it: open it on the site.
  | { kind: 'external'; url: string }
  // No tournament has the link's slugs.
  | { kind: 'notFound'; url: string };

type TournamentLink = Extract<GoChampsLink, { tournamentSlug: string }>;

export class ResolveGoChampsLinkUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  /** A failed tournament lookup is left to the caller, which can retry. */
  async execute(path: string): Promise<ResolvedGoChampsLink> {
    const link = parseGoChampsPath(path);

    switch (link.kind) {
      case 'home':
      case 'organization':
      case 'invite':
      case 'external':
        return link;
      // A game page needs only the game.
      case 'game':
        return { kind: 'game', gameId: link.gameId };
      default:
        return this.resolveInTournament(link);
    }
  }

  private async resolveInTournament(link: Exclude<TournamentLink, { kind: 'game' }>): Promise<ResolvedGoChampsLink> {
    const tournament = await this.tournamentRepository.getTournamentBySlugs(link.organizationSlug, link.tournamentSlug);
    if (!tournament) {
      return { kind: 'notFound', url: `${GO_CHAMPS_ORIGIN}/${link.organizationSlug}/${link.tournamentSlug}` };
    }

    const inTournament: InTournament = { tournamentId: tournament.id, apiBaseUrl: tournament.apiBaseUrl };
    switch (link.kind) {
      case 'tournament':
        return link.phaseId
          ? { kind: 'tournament', ...inTournament, phaseId: link.phaseId }
          : { kind: 'tournament', ...inTournament };
      case 'stats':
        return { kind: 'stats', ...inTournament };
      case 'team':
        return { kind: 'team', ...inTournament, teamId: link.teamId };
      case 'athlete':
        return { kind: 'athlete', ...inTournament, playerId: link.playerId };
    }
  }
}
