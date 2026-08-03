/**
 * Home — branded header, jump-back-in tiles and horizontal genre shelves.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrackPress } from '@/components/Card';
import { EmptyState, InlineError } from '@/components/EmptyState';
import { SectionRow } from '@/components/SectionRow';
import { Brandmark } from '@/components/SplashBrand';
import {
  Brand,
  Colors,
  Gradients,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { getShelves, getTopSongs, type Shelf, type Track } from '@/lib/itunes';
import { useLibrary } from '@/lib/storage';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onTrackPress = useTrackPress();
  const { recents } = useLibrary();

  const [popular, setPopular] = useState<Track[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [top, rows] = await Promise.all([getTopSongs({ limit: 12 }), getShelves({ limit: 12 })]);
      setError(null);
      setPopular(top.slice(0, 15));
      setShelves(rows.filter((shelf) => shelf.tracks.length > 0));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong loading music.'
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Fetching from the iTunes API is the "synchronise with an external system"
    // case effects exist for — `load` only touches state after its first await,
    // which the lint rule can't see through.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const jumpBackIn = recents.slice(0, 6);
  const showEmpty = !loading && !!error && popular.length === 0 && shelves.length === 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={Gradients.header}
        locations={[0, 0.55, 1]}
        style={[styles.headerGradient, { height: 300 + insets.top }]}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.elevated}
          />
        }>
        {/* Branding: app monogram + wordmark in the header. */}
        <View style={styles.header}>
          <Brandmark size="sm" />
          <Pressable
            onPress={() => router.push('/about')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="About this app"
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <Ionicons name="person-circle-outline" size={26} color={Colors.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.greetingSub}>{Brand.tagline}</Text>
        </Animated.View>

        {!!error && !showEmpty && <InlineError message={error} onRetry={onRefresh} />}

        {jumpBackIn.length > 0 && (
          <View style={styles.tileGrid}>
            {jumpBackIn.map((track) => (
              <Pressable
                key={track.id}
                onPress={() => onTrackPress(track, recents)}
                accessibilityRole="button"
                accessibilityLabel={`Play ${track.title}`}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <Image
                  source={track.coverUrl}
                  style={styles.tileArt}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                />
                <Text style={styles.tileText} numberOfLines={2}>
                  {track.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {showEmpty ? (
          <EmptyState
            tone="error"
            title="Can't reach the iTunes Store"
            message={error ?? undefined}
            actionLabel="Try again"
            onAction={onRefresh}
          />
        ) : (
          <>
            <SectionRow
              title="Popular right now"
              subtitle="Fresh from the iTunes Store"
              tracks={popular}
              loading={loading}
              cardWidth={168}
              onSeeAll={() =>
                router.push({ pathname: '/search', params: { q: 'top hits' } })
              }
            />

            {loading && shelves.length === 0
              ? ['a', 'b'].map((key) => (
                  <SectionRow key={key} title=" " tracks={[]} loading />
                ))
              : shelves.map((shelf) => (
                  <SectionRow
                    key={shelf.key}
                    title={shelf.title}
                    tracks={shelf.tracks}
                    onSeeAll={() =>
                      router.push({ pathname: '/search', params: { q: shelf.term } })
                    }
                  />
                ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    paddingBottom: Layout.miniPlayerHeight + Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  greetingBlock: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  greeting: {
    ...Typography.display,
  },
  greetingSub: {
    ...Typography.caption,
    fontWeight: '500',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xxl,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 56,
    paddingRight: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
  },
  tileArt: {
    width: 56,
    height: 56,
    backgroundColor: Colors.surface,
  },
  tileText: {
    ...Typography.caption,
    flex: 1,
    color: Colors.text,
    fontWeight: '700',
  },
});
