// SoulRoute Design Tokens — extracted from Figma
// Palette: mint greens, soft blues, warm whites, deep teals

export const Palette = {
  // Primary greens (from Figma mint/teal theme)
  mintLight: '#C8E6C9',
  mint: '#A8D5BA',
  mintDark: '#6BAB8A',
  teal: '#4DB6AC',
  tealDark: '#2D6A4F',
  deepGreen: '#1B5E20',

  // Backgrounds
  bgLight: '#F0FFF4',
  bgCard: '#FFFFFF',
  bgCardDark: '#1E2D2A',
  bgDark: '#0D1F1A',

  // Accents
  coral: '#FF7B6B',
  lavender: '#B39DDB',
  amber: '#FFD54F',
  sky: '#81D4FA',
  pink: '#F48FB1',

  // Fatigue level colors
  fatiguelow: '#4CAF50',
  fatigueMedium: '#FFC107',
  fatigueHigh: '#FF9800',
  fatigueCritical: '#F44336',

  // Neutral
  white: '#FFFFFF',
  offWhite: '#F5F9F7',
  grey100: '#F0F4F1',
  grey200: '#E4EBE7',
  grey400: '#9AB0A8',
  grey600: '#5A7A70',
  grey800: '#2C3E37',
  black: '#0A0F0D',

  // Gradients used across app
  gradientGreen: ['#A8D5BA', '#C8E6C9'] as [string, string],
  gradientTeal: ['#4DB6AC', '#80CBC4'] as [string, string],
  gradientCoral: ['#FF8A80', '#FFCCBC'] as [string, string],
  gradientNight: ['#1A237E', '#283593'] as [string, string],
  gradientLavender: ['#9C27B0', '#CE93D8'] as [string, string],
};

export const Typography = {
  fontFamily: {
    regular: undefined, // uses system default (SF Pro / Roboto)
    medium: undefined,
    bold: undefined,
  },
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SoulRouteColors = {
  light: {
    background: Palette.bgLight,
    surface: Palette.bgCard,
    surfaceAlt: Palette.grey100,
    primary: Palette.tealDark,
    primaryLight: Palette.mint,
    accent: Palette.coral,
    text: Palette.grey800,
    textSecondary: Palette.grey600,
    textMuted: Palette.grey400,
    border: Palette.grey200,
    tabBar: Palette.bgCard,
    tabBarActive: Palette.tealDark,
    tabBarInactive: Palette.grey400,
  },
  dark: {
    background: Palette.bgDark,
    surface: Palette.bgCardDark,
    surfaceAlt: '#152520',
    primary: Palette.mint,
    primaryLight: Palette.mintDark,
    accent: Palette.coral,
    text: '#E8F5E9',
    textSecondary: '#A5C5AD',
    textMuted: Palette.grey400,
    border: '#2A3E37',
    tabBar: '#111F1A',
    tabBarActive: Palette.mint,
    tabBarInactive: Palette.grey400,
  },
};
