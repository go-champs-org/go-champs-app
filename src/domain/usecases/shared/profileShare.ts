import { AthleteProfile } from '../../repositories/AthleteProfileRepository';
import { careerSummaries, CareerSummary } from './athleteHome';

// "Compartilhar perfil": the athlete's career summary as a transparent story
// sticker, in four formats (stats listed at the bottom or stacked big in the
// center, each with the dark or the white and lime Go Champs logo).

export type ShareLayout = 'bottom' | 'center';
export type ShareLogo = 'dark' | 'light';

export type ShareFormat = {
  id: string;
  layout: ShareLayout;
  logo: ShareLogo;
  // Under the preview: 'Lista · logo escuro'
  label: string;
  // For screen readers: 'Estatísticas embaixo, logo escuro'
  description: string;
};

const LAYOUT_LABELS: Record<ShareLayout, { label: string; description: string }> = {
  bottom: { label: 'Lista', description: 'Estatísticas embaixo' },
  center: { label: 'Destaque', description: 'Estatísticas em destaque no centro' },
};

const LOGO_LABELS: Record<ShareLogo, string> = {
  dark: 'logo escuro',
  light: 'logo claro',
};

const format = (layout: ShareLayout, logo: ShareLogo): ShareFormat => ({
  id: `${layout}-${logo}`,
  layout,
  logo,
  label: `${LAYOUT_LABELS[layout].label} · ${LOGO_LABELS[logo]}`,
  description: `${LAYOUT_LABELS[layout].description}, ${LOGO_LABELS[logo]}`,
});

export const SHARE_FORMATS: ShareFormat[] = [
  format('bottom', 'dark'),
  format('bottom', 'light'),
  format('center', 'dark'),
  format('center', 'light'),
];

export const DEFAULT_SHARE_FORMAT_ID = SHARE_FORMATS[0].id;

export const shareFormatById = (id: string): ShareFormat =>
  SHARE_FORMATS.find((candidate) => candidate.id === id) ?? SHARE_FORMATS[0];

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
