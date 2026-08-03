/**
 * Now Playing.
 *
 * Receives the same flat params the original app used (`artist`, `track`,
 * `cover_url`, `preview_url`) plus enough extras to rebuild a full `Track`, so
 * this screen never needs its own network request.
 *
 * Songs play through `PlayerContext` (expo-audio). Music videos are handed to
 * `expo-video` instead — the audio engine stays quiet for those.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LikeButton } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SignatureWatermark } from '@/components/SignatureWatermark';
import { usePlayer } from '@/context/PlayerContext';
import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { formatTime, paramsToTrack, releaseYear } from '@/lib/itunes';

export default function NowPlayingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();

  const {
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    duration,
    hasNext,
    hasPrevious,
    queue,
    playTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
  } = usePlayer();

  const paramTrack = useMemo(() => paramsToTrack(params), [params]);
  const track = paramTrack ?? currentTrack;
  const isVideo = track?.kind === 'music-video';

  // Opened via deep link (or after the queue moved on) — sync the player.
  useEffect(() => {
    if (paramTrack && currentTrack?.id !== paramTrack.id) {
      playTrack(paramTrack, queue.length ? queue : undefined);
    }
    // Only react to a genuinely different incoming track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTrack?.id]);

  /* ------------------------------- video ------------------------------- */

  const videoPlayer = useVideoPlayer(
    isVideo && track?.previewUrl ? track.previewUrl : null,
    (player) => {
      player.loop = false;
    }
  );

  useEffect(() => {
    if (isVideo) videoPlayer.play();
  }, [isVideo, videoPlayer]);

  /* ------------------------------ scrubbing ---------------------------- */

  // The bar is driven entirely on the UI thread so dragging stays smooth even
  // while status updates land at 4Hz on the JS thread.
  const trackWidth = useSharedValue(0);
  const playedRatio = useSharedValue(0);
  const scrubRatio = useSharedValue(0);
  const isScrubbing = useSharedValue(0);

  /** Only set while dragging, so the time label can preview the target. */
  const [scrubSeconds, setScrubSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (isScrubbing.get()) return;
    playedRatio.set(duration > 0 ? Math.min(position / duration, 1) : 0);
  }, [position, duration, isScrubbing, playedRatio]);

  const previewScrub = useCallback(
    (ratio: number) => setScrubSeconds(ratio * duration),
    [duration]
  );

  const commitScrub = useCallback(
    (ratio: number) => {
      seek(ratio * duration);
      setScrubSeconds(null);
    },
    [seek, duration]
  );

  const scrubGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((event) => {
          const width = trackWidth.get();
          if (width <= 0) return;
          const ratio = Math.min(Math.max(event.x / width, 0), 1);
          isScrubbing.set(1);
          scrubRatio.set(ratio);
          runOnJS(previewScrub)(ratio);
        })
        .onUpdate((event) => {
          const width = trackWidth.get();
          if (width <= 0) return;
          const ratio = Math.min(Math.max(event.x / width, 0), 1);
          scrubRatio.set(ratio);
          runOnJS(previewScrub)(ratio);
        })
        .onEnd(() => {
          // Hold the fill at the dropped position until the player catches up.
          playedRatio.set(scrubRatio.get());
          runOnJS(commitScrub)(scrubRatio.get());
        })
        .onFinalize(() => {
          isScrubbing.set(0);
        }),
    [commitScrub, previewScrub, isScrubbing, playedRatio, scrubRatio, trackWidth]
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${(isScrubbing.get() ? scrubRatio.get() : playedRatio.get()) * 100}%`,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    left:
      (isScrubbing.get() ? scrubRatio.get() : playedRatio.get()) * trackWidth.get() - 7,
  }));

  if (!track) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <EmptyState
          icon="musical-note"
          title="Nothing playing"
          message="Pick a song and it will show up here."
          actionLabel="Browse music"
          onAction={() => router.replace('/(tabs)')}
        />
        <SignatureWatermark />
      </View>
    );
  }

  const shownPosition = scrubSeconds ?? position;
  const artSize = Math.min(width - Spacing.xxl * 2, 340);
  const year = releaseYear(track.releaseDate);

  return (
    <View style={styles.screen}>
      {/* Blurred cover-art backdrop */}
      <Image
        source={track.coverUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={60}
        transition={320}
        cachePolicy="memory-disk"
      />
      <BlurView intensity={54} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={Gradients.nowPlaying}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close now playing"
            style={styles.topButton}>
            <Ionicons name="chevron-down" size={26} color={Colors.text} />
          </Pressable>

          <View style={styles.topLabels}>
            <Text style={styles.topLabel}>
              {isVideo ? 'Music video' : 'Playing from iTunes'}
            </Text>
            <Text style={styles.topContext} numberOfLines={1}>
              {track.album || track.genre || 'Preview'}
            </Text>
          </View>

          <View style={styles.topButton}>
            <LikeButton track={track} size={23} />
          </View>
        </View>

        {isVideo ? (
          <Animated.View entering={FadeIn.duration(320)} style={styles.videoWrap}>
            <VideoView
              player={videoPlayer}
              style={styles.video}
              contentFit="contain"
              nativeControls
            />
            <Text style={styles.videoHint}>
              Music videos play with the native video controls.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(420)}
            style={[
              styles.artWrap,
              { width: artSize, height: artSize },
              Shadows.hero,
            ]}>
            <Image
              source={track.coverUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={280}
              cachePolicy="memory-disk"
            />
          </Animated.View>
        )}

        <View style={styles.meta}>
          <View style={styles.metaText}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {track.artist}
              {year ? ` · ${year}` : ''}
            </Text>
          </View>
        </View>

        {!isVideo && (
          <>
            <View style={styles.progressBlock}>
              <GestureDetector gesture={scrubGesture}>
                <View
                  style={styles.progressHit}
                  onLayout={(event) => trackWidth.set(event.nativeEvent.layout.width)}>
                  <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, fillStyle]} />
                  </View>
                  <Animated.View style={[styles.progressKnob, knobStyle]} />
                </View>
              </GestureDetector>

              <View style={styles.times}>
                <Text style={styles.timeText}>{formatTime(shownPosition)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <Pressable
                onPress={playPrevious}
                disabled={!hasPrevious && position < 3}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Previous track"
                style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}>
                <Ionicons
                  name="play-skip-back"
                  size={30}
                  color={hasPrevious || position >= 3 ? Colors.text : Colors.textMuted}
                />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}>
                {isBuffering ? (
                  <ActivityIndicator color={Colors.onAccent} />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={Colors.onAccent}
                    style={isPlaying ? undefined : styles.playNudge}
                  />
                )}
              </Pressable>

              <Pressable
                onPress={playNext}
                disabled={!hasNext}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Next track"
                style={({ pressed }) => [styles.sideControl, pressed && styles.pressed]}>
                <Ionicons
                  name="play-skip-forward"
                  size={30}
                  color={hasNext ? Colors.text : Colors.textMuted}
                />
              </Pressable>
            </View>

            <Text style={styles.previewNote}>
              iTunes previews are 30 seconds · {hasNext ? 'auto-plays the next track' : 'last in queue'}
            </Text>
          </>
        )}

        <View style={styles.footer}>
          {/* Branding: watermark credit, deliberately low contrast. */}
          <SignatureWatermark />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.xxl,
  },
  topButton: {
    width: 44,
    alignItems: 'center',
  },
  topLabels: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  topLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  topContext: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
    maxWidth: 220,
  },
  artWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.elevated,
  },
  videoWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.md,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  meta: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  metaText: {
    flex: 1,
    gap: Spacing.xs,
  },
  trackTitle: {
    ...Typography.display,
    fontSize: 25,
    lineHeight: 31,
  },
  trackArtist: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressBlock: {
    alignSelf: 'stretch',
  },
  progressHit: {
    height: 26,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.text,
  },
  progressKnob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.text,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timeText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  sideControl: {
    padding: Spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    ...Shadows.glow,
  },
  playPressed: {
    backgroundColor: Colors.accentPressed,
    transform: [{ scale: 0.96 }],
  },
  playNudge: {
    marginLeft: 3,
  },
  previewNote: {
    ...Typography.micro,
    marginTop: Spacing.xl,
    textAlign: 'center',
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: Spacing.md,
    alignSelf: 'stretch',
  },
});
