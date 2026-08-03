/**
 * Search — debounced iTunes lookup with a Songs / Music Videos filter.
 *
 * Typing is never blocked on the network: the input is controlled locally and a
 * 300ms debounce fires the request, cancelling whatever was still in flight.
 */

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrackRow, TrackRowSkeleton } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { Colors, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { searchMusic, type SearchEntity, type Track } from '@/lib/itunes';

const DEBOUNCE_MS = 300;
const SKELETON_ROWS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];

const BROWSE_CHIPS = [
  'Thai pop',
  'K-pop',
  'Hip hop',
  'Rock',
  'Jazz',
  'Lofi',
  'EDM',
  'Acoustic',
  'Soundtrack',
  'Indie',
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const seededQuery = typeof params.q === 'string' ? params.q : '';

  const [query, setQuery] = useState(seededQuery);
  const [entity, setEntity] = useState<SearchEntity>('musicTrack');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The term the current `results` belong to, so we can label the header. */
  const [resolvedTerm, setResolvedTerm] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  // "See all" on Home deep-links here with a term. Adjusting state during render
  // (rather than in an effect) avoids a throwaway pass with the stale query.
  const [appliedSeed, setAppliedSeed] = useState(seededQuery);
  if (seededQuery !== appliedSeed) {
    setAppliedSeed(seededQuery);
    if (seededQuery) setQuery(seededQuery);
  }

  const runSearch = useCallback(
    async (term: string, kind: SearchEntity) => {
      abortRef.current?.abort();

      if (!term.trim()) {
        setResults([]);
        setResolvedTerm('');
        setLoading(false);
        setError(null);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const tracks = await searchMusic(term, {
          entity: kind,
          limit: 40,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResults(tracks);
        setResolvedTerm(term.trim());
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, entity), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, entity, runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const hasQuery = query.trim().length > 0;

  const renderBody = () => {
    if (loading && results.length === 0) {
      return (
        <View style={styles.skeletonList}>
          {SKELETON_ROWS.map((key) => (
            <TrackRowSkeleton key={key} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          tone="error"
          title="Search unavailable"
          message={error}
          actionLabel="Try again"
          onAction={() => runSearch(query, entity)}
        />
      );
    }

    if (!hasQuery) {
      return (
        <View style={styles.browse}>
          <Text style={styles.browseTitle}>Browse all</Text>
          <View style={styles.chips}>
            {BROWSE_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setQuery(chip)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                <Text style={styles.chipText}>{chip}</Text>
              </Pressable>
            ))}
          </View>

          <EmptyState
            icon="musical-notes"
            title="Search for your favorite songs"
            message="Artists, tracks and albums from the iTunes Store — with a 30-second preview for every result."
          />
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <EmptyState
          icon="sad-outline"
          title={`No results for "${query.trim()}"`}
          message="Check the spelling, or try a different artist or song title."
        />
      );
    }

    return null;
  };

  const body = renderBody();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          entity={entity}
          onChangeEntity={setEntity}
        />
      </View>

      {body ? (
        <Animated.ScrollView
          entering={FadeIn.duration(220)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {body}
        </Animated.ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.resultsMeta}>
              {results.length} {entity === 'musicVideo' ? 'music videos' : 'songs'} for “
              {resolvedTerm}”
            </Text>
          }
          renderItem={({ item, index }) => (
            <TrackRow track={item} queue={results} index={index + 1} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.display,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.miniPlayerHeight + Spacing.xxxl,
  },
  resultsMeta: {
    ...Typography.micro,
    marginBottom: Spacing.md,
  },
  skeletonList: {
    gap: Spacing.xs,
  },
  browse: {
    gap: Spacing.lg,
  },
  browseTitle: {
    ...Typography.section,
    fontSize: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 1,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  chipPressed: {
    backgroundColor: Colors.elevated,
    transform: [{ scale: 0.97 }],
  },
  chipText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
});
