export const theme = {
  colors: {
    primary: '#10130d',
    background: '#fafaee',
    surface: '#ffffff',
    surfaceMuted: '#e8eadf',
    surfaceStrong: '#dce8c4',
    textPrimary: '#1c2016',
    textSecondary: '#6f982c',
    accent: '#92c43f',
    accentSoft: '#e4edcf',
    card: '#ffffff',
    border: '#d5d8cc',
    shadow: '#000000',
    mutedText: '#62675a',
    inactive: '#9da294',
    danger: '#c62f2f',
    success: '#4f771c',
    overlay: 'rgba(16, 19, 13, 0.58)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    caption: 11,
    bodySmall: 13,
    body: 15,
    titleSmall: 17,
    title: 20,
    display: 28,
  },
  layout: {
    contentMaxWidth: 960,
    touchTarget: 44,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
};

export type Theme = typeof theme;
