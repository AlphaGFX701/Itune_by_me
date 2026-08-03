/**
 * Global playback state for KMUTNB CED iTune.
 *
 * One `expo-audio` player instance lives here for the whole app so the mini
 * player, Now Playing screen and any card can all drive the same audio.
 *
 * iTunes previews are ~30 seconds. When one ends we explicitly advance to the
 * next queued track instead of looping silently.
 */

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Track } from '@/lib/itunes';
import { addRecentlyPlayed } from '@/lib/storage';

type PlayerContextValue = {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  /** Seconds elapsed in the current preview. */
  position: number;
  /** Preview length in seconds (Apple previews are ~30s). */
  duration: number;
  hasNext: boolean;
  hasPrevious: boolean;
  /** Music videos are handed to `expo-video` on the Now Playing screen instead. */
  isVideoTrack: boolean;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (seconds: number) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const FALLBACK_DURATION = 30;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  /** What the user asked for; `status.playing` is what the OS actually does. */
  const [intendsToPlay, setIntendsToPlay] = useState(false);

  const currentTrack = queueIndex >= 0 ? (queue[queueIndex] ?? null) : null;
  const isVideoTrack = currentTrack?.kind === 'music-video';

  // Background playback + audible while the ringer switch is silenced.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // Audio session config is best-effort; playback still works without it.
    });
  }, []);

  /** Loads a queue entry into the player. Video tracks bypass the audio engine. */
  const loadIndex = useCallback(
    (list: Track[], index: number, autoPlay: boolean) => {
      const track = list[index];
      if (!track) return;

      setQueue(list);
      setQueueIndex(index);

      if (track.kind === 'music-video' || !track.previewUrl) {
        player.pause();
        player.replace(null);
        setIntendsToPlay(false);
      } else {
        player.replace({ uri: track.previewUrl, name: track.title });
        setIntendsToPlay(autoPlay);
        // Don't call play() here — replace() loads asynchronously, so an
        // immediate play() can silently no-op. The effect below starts
        // playback once the player reports the new source is loaded.

        try {
          player.setActiveForLockScreen(true, {
            title: track.title,
            artist: track.artist,
            albumTitle: track.album,
            artworkUrl: track.coverUrl,
          });
        } catch {
          // Lock screen controls are a bonus, never a requirement.
        }
      }

      addRecentlyPlayed(track).catch(() => {});
    },
    [player]
  );

  const playTrack = useCallback(
    (track: Track, nextQueue?: Track[]) => {
      const list = nextQueue?.length ? nextQueue : [track];
      const index = Math.max(
        0,
        list.findIndex((item) => item.id === track.id)
      );
      loadIndex(list, index, true);
    },
    [loadIndex]
  );

  const playNext = useCallback(() => {
    if (queueIndex < 0) return;
    const next = queueIndex + 1;
    if (next >= queue.length) {
      // End of queue — stop cleanly rather than restarting the same preview.
      player.pause();
      setIntendsToPlay(false);
      return;
    }
    loadIndex(queue, next, true);
  }, [loadIndex, player, queue, queueIndex]);

  const playPrevious = useCallback(() => {
    if (queueIndex < 0) return;
    // Standard player behaviour: restart the track unless we're near the top.
    if (status.currentTime > 3 || queueIndex === 0) {
      player.seekTo(0).catch(() => {});
      player.play();
      setIntendsToPlay(true);
      return;
    }
    loadIndex(queue, queueIndex - 1, true);
  }, [loadIndex, player, queue, queueIndex, status.currentTime]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack || isVideoTrack) return;
    if (status.playing) {
      player.pause();
      setIntendsToPlay(false);
    } else {
      player.play();
      setIntendsToPlay(true);
    }
  }, [currentTrack, isVideoTrack, player, status.playing]);

  const seek = useCallback(
    (seconds: number) => {
      if (!currentTrack || isVideoTrack) return;
      const max = status.duration || currentTrack.durationSeconds || FALLBACK_DURATION;
      player.seekTo(Math.min(Math.max(seconds, 0), max)).catch(() => {});
    },
    [currentTrack, isVideoTrack, player, status.duration]
  );

  const stop = useCallback(() => {
    player.pause();
    player.replace(null);
    setIntendsToPlay(false);
    setQueue([]);
    setQueueIndex(-1);
    try {
      player.clearLockScreenControls();
    } catch {
      // No-op when lock screen controls were never attached.
    }
  }, [player]);

  // Auto-advance when a 30s preview runs out. `didJustFinish` can be reported on
  // several consecutive status ticks, so guard on the track we already handled.
  const finishedTrackRef = useRef<string | null>(null);
  const playNextRef = useRef(playNext);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    if (currentTrack?.id !== finishedTrackRef.current) {
      finishedTrackRef.current = null;
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!status.didJustFinish || !currentTrack) return;
    if (finishedTrackRef.current === currentTrack.id) return;
    finishedTrackRef.current = currentTrack.id;
    playNextRef.current();
  }, [status.didJustFinish, currentTrack]);

  // Starts playback once a freshly loaded source is ready. Deliberately
  // ignores `didJustFinish` — that flag can still read `true` from the
  // *previous* track for a tick after `replace()` swaps in a new one, which
  // previously blocked this effect from ever starting the next song.
  useEffect(() => {
    if (intendsToPlay && status.isLoaded && !status.playing) {
      player.play();
    }
  }, [intendsToPlay, status.isLoaded, status.playing, player]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying: status.playing,
      isBuffering: status.isBuffering || (intendsToPlay && !status.isLoaded),
      position: status.currentTime ?? 0,
      duration:
        status.duration ||
        currentTrack?.durationSeconds ||
        FALLBACK_DURATION,
      hasNext: queueIndex >= 0 && queueIndex < queue.length - 1,
      hasPrevious: queueIndex > 0,
      isVideoTrack,
      playTrack,
      togglePlayPause,
      playNext,
      playPrevious,
      seek,
      stop,
    }),
    [
      currentTrack,
      queue,
      queueIndex,
      status.playing,
      status.isBuffering,
      status.isLoaded,
      status.currentTime,
      status.duration,
      intendsToPlay,
      isVideoTrack,
      playTrack,
      togglePlayPause,
      playNext,
      playPrevious,
      seek,
      stop,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used inside <PlayerProvider>');
  }
  return context;
}
