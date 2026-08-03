/**
 * Friendly placeholder for empty results, errors and first-run screens.
 * Used everywhere instead of leaving a screen blank.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors, Gradients, Radius, Spacing, Typography } from '@/constants/theme';

export function EmptyState({
  icon = 'musical-notes',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}) {
  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.container}>
      <LinearGradient
        colors={tone === 'error' ? ['#4A1618', '#241012'] : Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}>
        <Ionicons
          name={tone === 'error' ? 'cloud-offline' : icon}
          size={30}
          color={Colors.text}
        />
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}

      {!!actionLabel && !!onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

/** Small inline row used above a list when a background refresh fails. */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.inline}>
      <Ionicons name="alert-circle" size={16} color={Colors.danger} />
      <Text style={styles.inlineText} numberOfLines={2}>
        {message}
      </Text>
      {!!onRetry && (
        <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button">
          <Text style={styles.inlineRetry}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.title,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    ...Typography.caption,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 19,
  },
  action: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  actionPressed: {
    backgroundColor: Colors.accentPressed,
    transform: [{ scale: 0.97 }],
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.onAccent,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(226, 85, 79, 0.12)',
  },
  inlineText: {
    ...Typography.caption,
    flex: 1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  inlineRetry: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.accent,
  },
});
