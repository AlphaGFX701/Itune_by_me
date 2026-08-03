/**
 * Persistent playback bar that sits directly above the tab bar.
 *
 * Slides up the first time something plays, stays put while you browse, and
 * opens the Now Playing screen on tap.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { LikeButton } from '@/components/Card';
import { usePlayer } from '@/context/PlayerContext';
import { Colors, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { trackToParams } from '@/lib/itunes';

export function MiniPlayer({ bottom }: { bottom: number }) {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    isVideoTrack,
    position,
    duration,
    togglePlayPause,
    playNext,
    hasNext,
  } = usePlayer();

  const visible = !!currentTrack;
  const offset = useSharedValue(Layout.miniPlayerHeight + Spacing.lg);
  const opacity = useSharedValue(0);

  useEffect(() => {
    offset.set(visible
      ? withSpring(0, { damping: 18, stiffness: 180, mass: 0.8 })
      : withTiming(Layout.miniPlayerHeight + Spacing.lg, { duration: 220 }));
    opacity.set(withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    }));
  }, [visible, offset, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
    opacity: opacity.get(),
  }));

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.wrapper, { bottom }, containerStyle]}>
      <Pressable
        onPress={() =>
          currentTrack &&
          router.push({ pathname: '/preview', params: trackToParams(currentTrack) })
        }
        accessibilityRole="button"
        accessibilityLabel={
          currentTrack ? `Open now playing: ${currentTrack.title}` : 'Now playing'
        }
        style={styles.card}>
        <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />

        <View style={styles.content}>
          <View style={styles.art}>
            {!!currentTrack && (
              <Image
                source={currentTrack.coverUrl}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            )}
          </View>

          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack?.title ?? ''}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {isVideoTrack ? 'Music video · tap to watch' : currentTrack?.artist ?? ''}
            </Text>
          </View>

          {!!currentTrack && <LikeButton track={currentTrack} size={20} />}

          <Pressable
            onPress={togglePlayPause}
            disabled={isVideoTrack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={styles.playButton}>
            {isBuffering ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Ionicons
                name={isVideoTrack ? 'videocam' : isPlaying ? 'pause' : 'play'}
                size={22}
                color={Colors.text}
              />
            )}
          </Pressable>

          <Pressable
            onPress={playNext}
            disabled={!hasNext}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next track"
            style={styles.nextButton}>
            <Ionicons
              name="play-skip-forward"
              size={19}
              color={hasNext ? Colors.text : Colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.sm,
    right: Spacing.sm,
    zIndex: 20,
  },
  card: {
    height: Layout.miniPlayerHeight,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    ...Shadows.card,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.72)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  art: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 13.5,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '500',
  },
  playButton: {
    width: 34,
    alignItems: 'center',
  },
  nextButton: {
    width: 26,
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: 5,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
});
