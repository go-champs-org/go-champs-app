import { Organization } from './Organization';

export type TournamentPhase = {
  id: string;
  title: string | null;
  type: string | null;
};

export type TournamentDetails = {
  id: string;
  name: string;
  slug: string;
  organization: Organization;
  phases: TournamentPhase[];
  sport_name?: string;
  sport_slug?: string;
};

export type TournamentDetailsResponse = {
  data: TournamentDetails;
};
