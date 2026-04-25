/**
 * RecycleRight Pakistan — Collector App Theme
 *
 * Single source of truth for all visual tokens used across the Collector
 * mobile app. Mirrors the web admin dashboard's design language so the two
 * surfaces stay visually consistent.
 *
 * Import from one place:
 *   import theme from '../theme';
 *   import { colors, spacing, typography, shadows, radius } from '../theme';
 */

import { Platform } from 'react-native';

const colors = {
  primary: '#1E9B6B',
  primaryDark: '#17784F',
  primaryLight: '#E6F5EE',

  text: '#1A1A2E',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4F6',

  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider: '#EEF1F3',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  success: '#10B981',
  successLight: '#D1FAE5',

  info: '#3B82F6',
  infoLight: '#DBEAFE',

  overlay: 'rgba(26, 26, 46, 0.55)',
  shadow: '#0F172A',

  wasteTypes: {
    plastic: '#3B82F6',
    paper: '#F59E0B',
    metal: '#6B7280',
    glass: '#10B981',
  },

  statusBar: {
    style: 'dark-content',
    backgroundColor: '#F8FAFB',
  },
};

const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,

  screenHorizontal: 16,
  screenVertical: 16,
  cardPadding: 16,
  inputPadding: 14,
  buttonPaddingVertical: 14,
  buttonPaddingHorizontal: 24,
};

const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
  round: 999,

  card: 12,
  input: 8,
  buttonPrimary: 24,
  badge: 999,
};

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const typography = {
  fontFamily,
  fontFamilyMedium,

  display: {
    fontFamily: fontFamilyMedium,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h1: {
    fontFamily: fontFamilyMedium,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.text,
  },
  h2: {
    fontFamily: fontFamilyMedium,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.text,
  },
  h3: {
    fontFamily: fontFamilyMedium,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.text,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text,
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fontFamilyMedium,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.text,
  },
  button: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.textInverse,
  },
  buttonSmall: {
    fontFamily: fontFamilyMedium,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textInverse,
  },
  amount: {
    fontFamily: fontFamilyMedium,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.text,
  },
  amountLarge: {
    fontFamily: fontFamilyMedium,
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 42,
    letterSpacing: -0.6,
    color: colors.text,
  },
};

const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHover: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  modal: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  bottomBar: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
};

const layout = {
  bottomTabHeight: 64,
  headerHeight: 56,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  maxContentWidth: 480,
};

const animation = {
  fast: 150,
  normal: 220,
  slow: 320,
};

const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  layout,
  animation,
};

export { colors, spacing, radius, typography, shadows, layout, animation };
export default theme;
