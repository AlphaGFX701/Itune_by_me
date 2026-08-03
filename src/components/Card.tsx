/**
 * Track presentation primitives.
 *
 * `TrackCard`     — square artwork tile used inside horizontal shelves.
 * `TrackRow`      — full-width list row used by Search and Library.
 * `LikeButton`    — heart with a pop animation, persisted to AsyncStorage.
 * `*Skeleton`     — pulsing placeholders shown while a request is in flight.
 *
 * Tapping any card starts playback through `PlayerContext` *and* pushes
 * `/preview` with the same flat params the original app used.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { usePlayer } from '@/context/PlayerContext';
import {
  Colors,
  Gradients,
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { releaseYear, trackToParams, type Track } from '@/lib/itunes';
import { toggleFavorite, useLibrary } from '@/lib/storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Shared tap behaviour: play the track (with its shelf as the queue) and open
 * Now Playing. Music videos skip audio and go straight to the video screen.
 */
export function useTrackPress() {
  const router = useRouter();
  const { playTrack } = usePlayer();

  return useCallback(
    (track: Track, queue?: Track[]) => {
      playTrack(track, queue);
      router.push({ pathname: '/preview', params: trackToParams(track) });
    },
    [playTrack, router]
  );
}

/** Press-and-hold scale, shared by both card shapes. */
function usePressScale(to = 0.94) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const onPressIn = () => {
    scale.set(withTiming(to, { duration: 110, easing: Easing.out(Easing.quad) }));
  };
  const onPressOut = () => {
    scale.set(withSpring(1, { damping: 14, stiffness: 220 }));
  };
  return { style, onPressIn, onPressOut };
}

export function LikeButton({
  track,
  size = 22,
  style,
}: {
  track: Track;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { favorites } = useLibrary();
  const isFavorite = favorites.some((item) => item.id === track.id);
  const pop = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  const onPress = () => {
    pop.set(withSequence(
      withTiming(0.72, { duration: 90 }),
      withSpring(1.28, { damping: 6, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 240 })
    ));
    toggleFavorite(track).catch(() => {});
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      style={style}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? Colors.accent : Colors.textSecondary}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Small green bars that animate while this exact track is playing. */
function NowPlayingBars() {
  const a = useSharedValue(0.35);
  const b = useSharedValue(1);
  const c = useSharedValue(0.6);

  useEffect(() => {
    const loop = (value: typeof a, duration: number) => {
      value.value = withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    };
    loop(a, 380);
    loop(b, 520);
    loop(c, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barA = useAnimatedStyle(() => ({ transform: [{ scaleY: a.get() }] }));
  const barB = useAnimatedStyle(() => ({ transform: [{ scaleY: b.get() }] }));
  const barC = useAnimatedStyle(() => ({ transform: [{ scaleY: c.get() }] }));

  return (
    <View style={styles.bars}>
      <Animated.View style={[styles.bar, barA]} />
      <Animated.View style={[styles.bar, barB]} />
      <Animated.View style={[styles.bar, barC]} />
    </View>
  );
}

export function TrackCard({
  track,
  queue,
  width = Layout.shelfCardSize,
}: {
  track: Track;
  queue?: Track[];
  width?: number;
}) {
  const press = usePressScale();
  const onTrackPress = useTrackPress();
  const { currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <AnimatedPressable
      onPress={() => onTrackPress(track, queue)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      style={[{ width }, press.style]}>
      <View style={[styles.cardArtWrap, { width, height: width }, Shadows.card]}>
        <Image
          source={track.coverUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={Gradients.artScrim}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        {track.kind === 'music-video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={11} color={Colors.text} />
            <Text style={styles.videoBadgeText}>VIDEO</Text>
          </View>
        )}

        <View style={styles.cardPlayFab}>
          <Ionicons
            name={isCurrent && isPlaying ? 'pause' : 'play'}
            size={16}
            color={Colors.onAccent}
            style={isCurrent && isPlaying ? undefined : styles.playNudge}
          />
        </View>
      </View>

      <Text
        style={[styles.cardTitle, isCurrent && styles.currentText]}
        numberOfLines={1}>
        {track.title}
      </Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        {track.artist}
      </Text>
    </AnimatedPressable>
  );
}

export function TrackRow({
  track,
  queue,
  index,
  showLike = true,
}: {
  track: Track;
  queue?: Track[];
  /** Optional 1-based rank shown to the left of the artwork. */
  index?: number;
  showLike?: boolean;
}) {
  const press = usePressScale(0.975);
  const onTrackPress = useTrackPress();
  const { currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const year = releaseYear(track.releaseDate);

  return (
    <AnimatedPressable
      onPress={() => onTrackPress(track, queue)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
      style={[styles.row, press.style]}>
      {typeof index === 'number' && (
        <Text style={[styles.rank, isCurrent && styles.currentText]}>{index}</Text>
      )}

      <View style={styles.rowArtWrap}>
        <Image
          source={track.coverUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {isCurrent && (
          <View style={styles.rowArtOverlay}>
            {isPlaying ? (
              <NowPlayingBars />
            ) : (
              <Ionicons name="pause" size={16} color={Colors.accent} />
            )}
          </View>
        )}
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, isCurrent && styles.currentText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {track.kind === 'music-video' ? '🎬 ' : ''}
          {track.artist}
          {year ? ` · ${year}` : ''}
        </Text>
      </View>

      {showLike && <LikeButton track={track} size={20} style={styles.rowLike} />}
    </AnimatedPressable>
  );
}

/* ------------------------------ skeletons ------------------------------ */

function usePulse() {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.set(withRepeat(
      withSequence(
        withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.get() }));
}

export function TrackCardSkeleton({ width = Layout.shelfCardSize }: { width?: number }) {
  const pulse = usePulse();
  return (
    <Animated.View style={[{ width }, pulse]}>
      <View style={[styles.skeletonBlock, { width, height: width, borderRadius: Radius.lg }]} />
      <View style={[styles.skeletonBlock, styles.skeletonLine, { width: width * 0.85 }]} />
      <View style={[styles.skeletonBlock, styles.skeletonLine, { width: width * 0.55 }]} />
    </Animated.View>
  );
}

export function TrackRowSkeleton() {
  const pulse = usePulse();
  return (
    <Animated.View style={[styles.row, pulse]}>
      <View
        style={[
          styles.skeletonBlock,
          { width: Layout.rowArtSize, height: Layout.rowArtSize, borderRadius: Radius.sm },
        ]}
      />
      <View style={styles.rowText}>
        <View style={[styles.skeletonBlock, styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonBlock, styles.skeletonLine, { width: '45%' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardArtWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
  },
  cardPlayFab: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  playNudge: {
    marginLeft: 2,
  },
  videoBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  videoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: Colors.text,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  cardSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  currentText: {
    color: Colors.accent,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  rank: {
    ...Typography.caption,
    width: 22,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  rowArtWrap: {
    width: Layout.rowArtSize,
    height: Layout.rowArtSize,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
  },
  rowArtOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  rowSubtitle: {
    ...Typography.caption,
    fontWeight: '500',
  },
  rowLike: {
    paddingHorizontal: Spacing.sm,
  },

  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 16,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },

  skeletonBlock: {
    backgroundColor: Colors.elevated,
  },
  skeletonLine: {
    height: 11,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
});
