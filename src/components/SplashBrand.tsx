/**
 * Brand assets for KMUTNB CED iTune — by Thanadon Jaimuang.
 *
 * `SplashBrand`  — the animated cold-start overlay (also reused, static, on About).
 * `Brandmark`    — the "iT" monogram + wordmark lockup used in screen headers.
 * `Monogram`     — just the rounded-square monogram.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const ENTER_MS = 750;
const HOLD_MS = 620;
const EXIT_MS = 420;

type MonogramSize = 'sm' | 'md' | 'lg';

const MONOGRAM_SIZES: Record<MonogramSize, { box: number; radius: number; font: number }> = {
  sm: { box: 34, radius: Radius.md, font: 15 },
  md: { box: 46, radius: Radius.lg, font: 20 },
  lg: { box: 84, radius: Radius.xxl, font: 36 },
};

export function Monogram({
  size = 'md',
  style,
}: {
  size?: MonogramSize;
  style?: StyleProp<ViewStyle>;
}) {
  const { box, radius, font } = MONOGRAM_SIZES[size];

  return (
    <LinearGradient
      colors={Gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: box,
          height: box,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
        },
        Shadows.glow,
        style,
      ]}>
      <Text
        style={{
          fontSize: font,
          fontWeight: '900',
          letterSpacing: -1.2,
          color: Colors.text,
        }}>
        {Brand.monogram}
      </Text>
    </LinearGradient>
  );
}

/** Header lockup: monogram + app name (+ optional author line). */
export function Brandmark({
  size = 'sm',
  showAuthor = false,
  style,
}: {
  size?: MonogramSize;
  showAuthor?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.lockup, style]}>
      <Monogram size={size} />
      <View style={styles.lockupText}>
        <Text style={styles.wordmarkSmall} numberOfLines={1}>
          {Brand.name}
        </Text>
        {showAuthor && (
          <Text style={styles.authorSmall} numberOfLines={1}>
            {Brand.authorLine}
          </Text>
        )}
      </View>
    </View>
  );
}

/** The large centered wordmark used on the splash and the About header. */
export function BrandWordmark() {
  return (
    <View style={styles.centered}>
      <Monogram size="lg" />
      <Text style={styles.wordmark}>{Brand.name}</Text>
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
      <Text style={styles.author}>{Brand.authorLine}</Text>
    </View>
  );
}

/**
 * Cold-start splash. Renders as an absolute overlay above the app, animates the
 * wordmark in, holds, then fades away and calls `onFinish`.
 */
export function SplashBrand({ onFinish }: { onFinish: () => void }) {
  const overlayOpacity = useSharedValue(1);
  const markScale = useSharedValue(0.72);
  const markOpacity = useSharedValue(0);
  const titleShift = useSharedValue(18);
  const titleOpacity = useSharedValue(0);
  const ruleScale = useSharedValue(0);
  const authorOpacity = useSharedValue(0);
  const glow = useSharedValue(0.15);

  useEffect(() => {
    markOpacity.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    markScale.set(withSpring(1, { damping: 12, stiffness: 140, mass: 0.9 }));
    glow.set(withTiming(0.55, { duration: ENTER_MS, easing: Easing.out(Easing.quad) }));

    titleOpacity.set(withDelay(
      220,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    ));
    titleShift.set(withDelay(220, withSpring(0, { damping: 15, stiffness: 130 })));

    ruleScale.set(withDelay(
      420,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })
    ));
    authorOpacity.set(withDelay(
      520,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    ));

    overlayOpacity.set(
      withDelay(
        ENTER_MS + HOLD_MS,
        withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(onFinish)();
        })
      )
    );
    // Animation values are stable shared values; this runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.get() }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.get(),
    transform: [{ scale: markScale.get() }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.get(),
    transform: [{ translateY: titleShift.get() }],
  }));
  const ruleStyle = useAnimatedStyle(() => ({
    opacity: ruleScale.get(),
    transform: [{ scaleX: ruleScale.get() }],
  }));
  const authorStyle = useAnimatedStyle(() => ({ opacity: authorOpacity.get() }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.splash, overlayStyle]} pointerEvents="none">
      <LinearGradient
        colors={Gradients.splash}
        locations={[0, 0.38, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glowOrb, glowStyle]} pointerEvents="none" />

      <View style={styles.centered}>
        <Animated.View style={markStyle}>
          <Monogram size="lg" />
        </Animated.View>

        <Animated.Text style={[styles.wordmark, titleStyle]}>{Brand.name}</Animated.Text>

        <Animated.View style={ruleStyle}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rule}
          />
        </Animated.View>

        <Animated.Text style={[styles.author, authorStyle]}>{Brand.authorLine}</Animated.Text>
      </View>

      <Animated.Text style={[styles.institution, authorStyle]}>{Brand.institution}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    zIndex: 100,
  },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.accent,
    top: '26%',
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  wordmark: {
    ...Typography.wordmark,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  rule: {
    width: 76,
    height: 3,
    borderRadius: Radius.pill,
  },
  author: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  institution: {
    ...Typography.micro,
    position: 'absolute',
    bottom: Spacing.xxxl,
    color: 'rgba(255,255,255,0.42)',
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lockupText: {
    flexShrink: 1,
  },
  wordmarkSmall: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: Colors.text,
  },
  authorSmall: {
    ...Typography.micro,
    letterSpacing: 0.5,
    textTransform: 'none',
    color: Colors.textMuted,
  },
});
