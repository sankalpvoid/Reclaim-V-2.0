export const colors = {
  background: '#09090D',
  backgroundRaised: '#0E0D13',
  surface: '#121118',
  surfaceRaised: '#181620',
  surfaceAccent: '#21152F',
  textPrimary: '#F8F6FC',
  textSecondary: '#AAA5B4',
  textTertiary: '#76717F',
  border: '#27232F',
  borderStrong: '#3A3146',
  accent: '#A855F7',
  accentLight: '#C084FC',
  accentMuted: '#7E22CE',
  accentSoft: '#261437',
  success: '#79CFA6',
  successSoft: '#14261F',
  warning: '#E5B86F',
  warningSoft: '#2B2113',
  danger: '#E68484',
  dangerSoft: '#2E171B',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  display: 38,
  headline: 30,
  title: 21,
  body: 16,
  caption: 12,
  micro: 11,
} as const;

export const layout = {
  contentMaxWidth: 640,
  compactMaxWidth: 500,
} as const;
