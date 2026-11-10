import { AthleteProfile } from '../../repositories/AthleteProfileRepository';
import { careerSummaries, CareerSummary } from './athleteHome';
import { buildShareFormats, ShareFormat } from './shareFormats';

// "Compartilhar perfil": the athlete's career summary as a transparent story
// sticker, in four formats (stats listed at the bottom or stacked big in the
// center, each with the dark or the white and lime Go Champs logo).

export type ProfileShareLayout = 'bottom' | 'center';
export type ProfileShareFormat = ShareFormat<ProfileShareLayout>;

export const PROFILE_SHARE_FORMATS: ProfileShareFormat[] = buildShareFormats<ProfileShareLayout>({
  bottom: { label: 'Lista', description: 'Estatísticas embaixo' },
  center: { label: 'Destaque', description: 'Estatísticas em destaque no centro' },
});

export type ShareStat = {
  key: string;
  label: string;
  // 'Pontos por jogo', the heading of the big number in the center layout
  perGameLabel: string;
  total: string;
  perGame: string;
  // '312 no total'
  totalCaption: string;
};

export type ProfileShareCard = {
  name: string;
  sport: string;
  tournaments: string;
  games: string;
  stats: ShareStat[];
};

// The sticker is about basketball 5x5. An athlete who only plays another
// sport shares that one instead.
export const SHARE_SPORT = 'basketball_5x5';

const pickSummary = (summaries: CareerSummary[]): CareerSummary | undefined =>
  summaries.find((summary) => summary.sportSlug === SHARE_SPORT) ?? summaries[0];

/**
 * The content of every format: the same numbers as the profile's "Resumo"
 * card. No sticker without a career (nothing to show yet).
 */
export const profileShareCard = (profile: AthleteProfile | null): ProfileShareCard | null => {
  if (!profile) return null;
  const summary = pickSummary(careerSummaries(profile.career_stats));
  if (!summary) return null;
  return {
    name: profile.name || profile.username,
    sport: summary.title,
    tournaments: summary.tournaments,
    games: summary.games,
    stats: summary.rows.map((row) => ({
      key: row.key,
      label: row.label,
      perGameLabel: `${row.label} por jogo`,
      total: row.total,
      perGame: row.perGame,
      totalCaption: `${row.total} no total`,
    })),
  };
};
