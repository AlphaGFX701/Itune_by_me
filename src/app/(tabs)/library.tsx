/**
 * Library — favourites and recently played, both read live from AsyncStorage,
 * plus the entry point to the About / credits screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrackRow, useTrackPress } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Brandmark } from '@/components/SplashBrand';
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
import type { Track } from '@/lib/itunes';
import { clearRecentlyPlayed, useLibrary } from '@/lib/storage';

type LibraryTab = 'favorites' | 'recents';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onTrackPress = useTrackPress();
  const { favorites, recents } = useLibrary();
  const { currentTrack } = usePlayer();

  const [tab, setTab] = useState<LibraryTab>('favorites');
  const data: Track[] = tab === 'favorites' ? favorites : recents;

  const summary = useMemo(
    () =>
      tab === 'favorites'
        ? `${favorites.length} liked ${favorites.length === 1 ? 'song' : 'songs'}`
        : `${recents.length} recently played`,
    [tab, favorites.length, recents.length]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        {/* Branding: wordmark repeated in the Library header. */}
        <Brandmark size="sm" />
        <Pressable
          onPress={() => router.push('/about')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="About this app"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons name="settings-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <Text style={styles.title}>Your Library</Text>

      <View style={styles.tabs}>
        {(
          [
            { key: 'favorites', label: 'Favorites', icon: 'heart' },
            { key: 'recents', label: 'Recently played', icon: 'time' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.tabPill, active && styles.tabPillActive]}>
              <Ionicons
                name={item.icon}
                size={13}
                color={active ? Colors.onAccent : Colors.textSecondary}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          data.length > 0 ? (
            <Animated.View entering={FadeIn.duration(220)} style={styles.summaryRow}>
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  {tab === 'favorites' ? 'Liked Songs' : 'Recently played'}
                </Text>
                <Text style={styles.summaryMeta}>{summary}</Text>
              </View>

              {tab === 'recents' && (
                <Pressable
                  onPress={() => clearRecentlyPlayed()}
                  hitSlop={8}
                  accessibilityRole="button"
                  style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => onTrackPress(data[0], data)}
                accessibilityRole="button"
                accessibilityLabel="Play all"
                style={({ pressed }) => [styles.playAll, pressed && styles.pressed]}>
                <Ionicons
                  name={currentTrack && data.some((t) => t.id === currentTrack.id) ? 'shuffle' : 'play'}
                  size={20}
                  color={Colors.onAccent}
                />
              </Pressable>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={
          tab === 'favorites' ? (
            <EmptyState
              icon="heart-outline"
              title="Nothing liked yet"
              message="Tap the heart on any song and it lands here — stored on your device, no account needed."
              actionLabel="Find something to love"
              onAction={() => router.push('/search')}
            />
          ) : (
            <EmptyState
              icon="time-outline"
              title="No listening history"
              message="Songs you play show up here so you can jump back in."
              actionLabel="Start listening"
              onAction={() => router.push('/search')}
            />
          )
        }
        renderItem={({ item }) => <TrackRow track={item} queue={data} />}
        ListFooterComponent={
          <Pressable
            onPress={() => router.push('/about')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.aboutCard, pressed && styles.pressed]}>
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aboutIcon}>
              <Ionicons name="information" size={19} color={Colors.text} />
            </LinearGradient>
            <View style={styles.aboutText}>
              <Text style={styles.aboutTitle}>About this app</Text>
              <Text style={styles.aboutMeta}>Credits, version and the team behind it</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    ...Typography.display,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.elevated,
  },
  tabPillActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.onAccent,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.miniPlayerHeight + Spacing.xxxl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    ...Typography.title,
  },
  summaryMeta: {
    ...Typography.caption,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  playAll: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    ...Shadows.glow,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  aboutIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: {
    flex: 1,
    gap: 2,
  },
  aboutTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  aboutMeta: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
