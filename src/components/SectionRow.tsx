/**
 * A horizontal shelf: bold section header + a scrolling row of `TrackCard`s.
 * Renders pulsing skeletons instead of a blank gap while the shelf loads.
 */

import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { TrackCard, TrackCardSkeleton } from '@/components/Card';
import { Colors, Layout, Spacing, Typography } from '@/constants/theme';
import type { Track } from '@/lib/itunes';

const SKELETON_KEYS = ['s1', 's2', 's3'];

export function SectionRow({
  title,
  subtitle,
  tracks,
  loading = false,
  onSeeAll,
  cardWidth = Layout.shelfCardSize,
}: {
  title: string;
  subtitle?: string;
  tracks: Track[];
  loading?: boolean;
  onSeeAll?: () => void;
  cardWidth?: number;
}) {
  if (!loading && tracks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {!!onSeeAll && (
          <Pressable
            onPress={onSeeAll}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
            style={styles.seeAll}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          {SKELETON_KEYS.map((key) => (
            <TrackCardSkeleton key={key} width={cardWidth} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={tracks}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.lg }} />}
          renderItem={({ item }) => (
            <TrackCard track={item} queue={tracks} width={cardWidth} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.section,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Layout.screenPadding,
  },
});
