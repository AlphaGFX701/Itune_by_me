/**
 * KMUTNB CED iTune — design system
 * by Thanadon Jaimuang
 *
 * Every color, space, radius and text style in the app comes from this file.
 * If you find a magic number in a screen, it belongs here instead.
 */

import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Colors = {
  /** App canvas */
  background: '#121212',
  /** Cards, rows, sheets */
  surface: '#181818',
  /** Raised chips, pressed states, skeletons */
  elevated: '#282828',
  /** Hairlines & dividers */
  border: '#2A2A2A',
  /** Signature green */
  accent: '#1DB954',
  accentPressed: '#189945',
  /** Brand secondary, used in gradients and the monogram */
  violet: '#7B2FF7',
  violetDeep: '#2A0E4F',

  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',
  onAccent: '#00120A',

  scrim: 'rgba(0, 0, 0, 0.55)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  danger: '#E2554F',
} as const;

type GradientStops = readonly [string, string, ...string[]];

export const Gradients = {
  /** Splash background — deep purple → green → black */
  splash: ['#1B0733', '#3B1063', '#0E3B22', '#050505'] as GradientStops,
  /** The wordmark accent sweep */
  brand: ['#7B2FF7', '#1DB954'] as GradientStops,
  /** Screen headers fading into the canvas */
  header: ['#2E1150', '#1B0B2E', Colors.background] as GradientStops,
  /** Bottom scrim over artwork so text stays readable */
  artScrim: ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)'] as GradientStops,
  /** Now Playing backdrop over the blurred cover */
  nowPlaying: ['rgba(18,18,18,0.10)', 'rgba(18,18,18,0.70)', '#121212'] as GradientStops,
  /** Tab bar fade so content dissolves behind it */
  tabFade: ['rgba(18,18,18,0)', 'rgba(18,18,18,0.92)', Colors.background] as GradientStops,
} as const;

/** Per-shelf tints, used to color the gradient behind each Home row header. */
export const ShelfTints: GradientStops[] = [
  ['#B33A96', '#4A1354'],
  ['#1E6FD9', '#123A6B'],
  ['#D9822B', '#5C2E10'],
  ['#1DB954', '#0C4A26'],
  ['#8E44AD', '#2B1140'],
];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
})!;

export const Typography = {
  /** Splash / About wordmark */
  wordmark: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: Colors.text,
  } as TextStyle,
  /** Screen titles — "Good evening" */
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.text,
  } as TextStyle,
  /** Shelf headers — "Popular right now" */
  section: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.text,
  } as TextStyle,
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: Colors.text,
  } as TextStyle,
  body: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
    color: Colors.text,
  } as TextStyle,
  caption: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  } as TextStyle,
  micro: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  } as TextStyle,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  } as ViewStyle,
  hero: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  } as ViewStyle,
  glow: {
    shadowColor: Colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  } as ViewStyle,
} as const;

export const Layout = {
  /** Height of the mini player bar (excludes safe-area inset) */
  miniPlayerHeight: 60,
  /** Height of the tab bar (excludes safe-area inset) */
  tabBarHeight: 62,
  /** Square artwork inside a horizontal shelf */
  shelfCardSize: 150,
  /** Artwork thumbnail inside a list row */
  rowArtSize: 54,
  screenPadding: Spacing.lg,
} as const;

/** Product identity — referenced by the splash, headers, About screen and watermark. */
export const Brand = {
  name: 'KMUTNB CED iTune',
  monogram: 'iT',
  author: 'Thanadon Jaimuang',
  authorLine: 'by Thanadon Jaimuang',
  tagline: 'Music discovery powered by the iTunes API',
  institution: 'KMUTNB · Computer Education (CED)',
  watermark: 'KMUTNB CED iTune • Thanadon Jaimuang',
  version: '1.0.0',
} as const;
