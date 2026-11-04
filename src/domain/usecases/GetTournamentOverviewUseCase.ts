import { TournamentRepository } from '../repositories/TournamentRepository';
import { PhaseKind, phaseKind } from './shared/phasePresentation';

export type TournamentTeam = {
  id: string;
  name: string;
  logo_url: string | null;
  tri_code: string | null;
};

export type TournamentPlayer = {
  id: string;
  name: string;
  photo_url: string | null;
  team_id: string | null;
};

export type TournamentPhaseOption = {
  id: string;
  title: string;
  order: number;
  isInProgress: boolean;
  kind: PhaseKind;
};

export type TournamentOverview = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  organizationName: string;
  organizationSlug: string;
  // Inferred, as on the public site: any phase in progress reads as live.
  isActive: boolean;
  teams: TournamentTeam[];
  players: TournamentPlayer[];
  phases: TournamentPhaseOption[];
  defaultPhaseId: string | null;
  hasAggregatedPlayerStats: boolean;
  sportSlug: string;
  playerStats: { slug: string | null; title: string }[];
};

export class GetTournamentOverviewUseCase {
  constructor(private readonly tournamentRepository: TournamentRepository) {}

  async execute(tournamentId: string, apiBaseUrl?: string): Promise<TournamentOverview> {
    const { data } = await this.tournamentRepository.getTournamentHistory(tournamentId, apiBaseUrl);
    const supported = (data.phases ?? []).flatMap((phase) => {
      const kind = phaseKind(phase);
      return kind
        ? [{ id: phase.id, title: phase.title || 'Fase', order: phase.order, isInProgress: Boolean(phase.is_in_progress), kind }]
        : [];
    });
    // The phase in progress, else the first one as the API returned it — the
    // same default the public site and the CMS open on.
    const defaultPhase = supported.find((phase) => phase.isInProgress) ?? supported[0];

    return {
      id: data.id,
      name: data.name,
      slug: data.slug || '',
      logoUrl: data.logo_url || null,
      organizationName: data.organization?.name || '',
      organizationSlug: data.organization?.slug || '',
      isActive: supported.some((phase) => phase.isInProgress),
      teams: (data.teams ?? [])
        .map((team) => ({ id: team.id, name: team.name, logo_url: team.logo_url || null, tri_code: team.tri_code || null }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      players: (data.players ?? []).map((player) => ({
        id: player.id,
        name: player.name,
        photo_url: player.photo_url || null,
        team_id: player.team_id || null,
      })),
      phases: [...supported].sort((a, b) => a.order - b.order),
      defaultPhaseId: defaultPhase?.id ?? null,
      hasAggregatedPlayerStats: Boolean(data.has_aggregated_player_stats),
      sportSlug: data.sport_slug || '',
      playerStats: data.player_stats ?? [],
    };
  }
}
