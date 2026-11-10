// The share stickers (Compartilhar perfil, Compartilhar jogo) come in formats:
// each layout twice, with the dark or the white and lime Go Champs logo.

export type ShareLogo = 'dark' | 'light';

export type ShareFormat<Layout extends string = string> = {
  id: string;
  layout: Layout;
  logo: ShareLogo;
  // Under the preview: 'Lista · logo escuro'
  label: string;
  // For screen readers: 'Estatísticas embaixo, logo escuro'
  description: string;
};

export type ShareLayoutLabels<Layout extends string> = Record<Layout, { label: string; description: string }>;

const LOGOS: ShareLogo[] = ['dark', 'light'];

const LOGO_LABELS: Record<ShareLogo, string> = {
  dark: 'logo escuro',
  light: 'logo claro',
};

/** Every layout with both logos, in the order the layouts are listed. */
export const buildShareFormats = <Layout extends string>(layouts: ShareLayoutLabels<Layout>): ShareFormat<Layout>[] =>
  (Object.keys(layouts) as Layout[]).flatMap((layout) =>
    LOGOS.map((logo) => ({
      id: `${layout}-${logo}`,
      layout,
      logo,
      label: `${layouts[layout].label} · ${LOGO_LABELS[logo]}`,
      description: `${layouts[layout].description}, ${LOGO_LABELS[logo]}`,
    }))
  );

/** The format with that id; the first one for an unknown id. */
export const shareFormatById = <Format extends { id: string }>(formats: Format[], id: string): Format =>
  formats.find((candidate) => candidate.id === id) ?? formats[0];
