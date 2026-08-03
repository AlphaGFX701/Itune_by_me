/**
 * About / credits.
 *
 * The permanent home of the app's signature: wordmark, author, institution and
 * version — the last of which is read straight out of `app.json` so the screen
 * can never drift from the config.
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignatureWatermark } from '@/components/SignatureWatermark';
import { BrandWordmark } from '@/components/SplashBrand';
import {
  Brand,
  Colors,
  Gradients,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

const appVersion = Constants.expoConfig?.version ?? Brand.version;
const appAuthor =
  (Constants.expoConfig?.extra as { author?: string } | undefined)?.author ?? Brand.author;

const CREDITS: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
  { icon: 'cloud-outline', label: 'Data source', value: 'iTunes Search API' },
  { icon: 'musical-note-outline', label: 'Playback', value: 'expo-audio · expo-video' },
  { icon: 'navigate-outline', label: 'Navigation', value: 'Expo Router (file-based)' },
  { icon: 'save-outline', label: 'Storage', value: 'AsyncStorage — on device only' },
];

/** One particle of the signature easter-egg burst. */
function Sparkle({
  trigger,
  angle,
  distance,
  delay,
  icon,
}: {
  trigger: number;
  angle: number;
  distance: number;
  delay: number;
  icon: 'heart' | 'sparkles' | 'musical-note';
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    progress.set(0);
    progress.set(withSequence(
      withTiming(0, { duration: delay }),
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    ));
  }, [trigger, delay, progress]);

  const style = useAnimatedStyle(() => {
    const travelled = progress.get() * distance;
    return {
      opacity: progress.get() === 0 ? 0 : 1 - progress.get(),
      transform: [
        { translateX: Math.cos(angle) * travelled },
        { translateY: Math.sin(angle) * travelled - progress.get() * 12 },
        { scale: 0.5 + progress.get() * 0.9 },
        { rotate: `${progress.get() * 90}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.sparkle, style]} pointerEvents="none">
      <Ionicons
        name={icon}
        size={14}
        color={icon === 'heart' ? Colors.accent : Colors.violet}
      />
    </Animated.View>
  );
}

const SPARKLES = Array.from({ length: 10 }, (_, index) => ({
  angle: (index / 10) * Math.PI * 2,
  distance: 52 + (index % 3) * 16,
  delay: (index % 4) * 45,
  icon: (['heart', 'sparkles', 'musical-note'] as const)[index % 3],
}));

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [burst, setBurst] = useState(0);
  const signatureScale = useSharedValue(1);

  const signatureStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signatureScale.get() }],
  }));

  const onSignaturePress = () => {
    setBurst((count) => count + 1);
    signatureScale.set(withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1.06, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 220 })
    ));
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={Gradients.splash}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>About</Text>
          <View style={styles.backButton} />
        </View>

        {/* Branding: the full wordmark lockup, same one used on the splash. */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
          <BrandWordmark />
          <Text style={styles.tagline}>{Brand.tagline}</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.card}>
          <Text style={styles.cardLabel}>Made by</Text>

          <Pressable
            onPress={onSignaturePress}
            accessibilityRole="button"
            accessibilityLabel={`Made by ${appAuthor}. Tap for a surprise.`}
            style={styles.signatureWrap}>
            {SPARKLES.map((sparkle, index) => (
              <Sparkle key={index} trigger={burst} {...sparkle} />
            ))}
            <Animated.Text style={[styles.signature, signatureStyle]}>
              {appAuthor}
            </Animated.Text>
          </Pressable>

          <Text style={styles.institution}>{Brand.institution}</Text>
          <Text style={styles.institutionSub}>
            King Mongkut&apos;s University of Technology North Bangkok
          </Text>

          {burst > 0 && (
            <Animated.Text entering={FadeInDown.duration(260)} style={styles.eggHint}>
              {burst < 5
                ? 'Thanks for tapping ♪'
                : 'Okay, you really like tapping that. Enjoy the music ♥'}
            </Animated.Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(420)} style={styles.card}>
          <Text style={styles.cardLabel}>Built with</Text>
          {CREDITS.map((credit) => (
            <View key={credit.label} style={styles.creditRow}>
              <View style={styles.creditIcon}>
                <Ionicons name={credit.icon} size={16} color={Colors.accent} />
              </View>
              <View style={styles.creditText}>
                <Text style={styles.creditLabel}>{credit.label}</Text>
                <Text style={styles.creditValue}>{credit.value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Text style={styles.disclaimer}>
          Music previews, artwork and metadata are provided by Apple&apos;s public iTunes Search
          API. This is a student project and is not affiliated with Apple Inc.
        </Text>

        {/* Branding: the same watermark used on Now Playing. */}
        <SignatureWatermark style={styles.watermark} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  topTitle: {
    ...Typography.title,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  tagline: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 280,
  },
  versionPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
  },
  versionText: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardLabel: {
    ...Typography.micro,
  },
  signatureWrap: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  signature: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: Colors.text,
  },
  sparkle: {
    position: 'absolute',
    left: '40%',
    top: '30%',
  },
  institution: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
  },
  institutionSub: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  eggHint: {
    ...Typography.caption,
    color: Colors.violet,
    fontWeight: '700',
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  creditIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.elevated,
  },
  creditText: {
    flex: 1,
    gap: 1,
  },
  creditLabel: {
    ...Typography.micro,
  },
  creditValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  disclaimer: {
    ...Typography.caption,
    fontSize: 11.5,
    lineHeight: 17,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  watermark: {
    paddingBottom: Spacing.lg,
  },
});
