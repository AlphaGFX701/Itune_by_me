/**
 * Search field + the Songs / Music Videos pill filter.
 *
 * The field is fully controlled; debouncing lives in the Search screen so the
 * text stays responsive while requests lag behind.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { SearchEntity } from '@/lib/itunes';

export const SEARCH_FILTERS: { key: SearchEntity; label: string; icon: 'musical-notes' | 'videocam' }[] =
  [
    { key: 'musicTrack', label: 'Songs', icon: 'musical-notes' },
    { key: 'musicVideo', label: 'Music Videos', icon: 'videocam' },
  ];

export function SearchBar({
  value,
  onChangeText,
  entity,
  onChangeEntity,
  autoFocus = false,
  placeholder = 'Songs, artists or albums',
}: {
  value: string;
  onChangeText: (next: string) => void;
  entity: SearchEntity;
  onChangeEntity: (next: SearchEntity) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const focus = useSharedValue(0);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.get(), [0, 1], [Colors.border, Colors.accent]),
    backgroundColor: interpolateColor(focus.get(), [0, 1], [Colors.surface, Colors.elevated]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.field, fieldStyle]}>
        <Ionicons name="search" size={19} color={Colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          autoFocus={autoFocus}
          selectionColor={Colors.accent}
          onFocus={() => {
            focus.set(withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }));
          }}
          onBlur={() => {
            focus.set(withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }));
          }}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={19} color={Colors.textMuted} />
          </Pressable>
        )}
      </Animated.View>

      <View style={styles.pills}>
        {SEARCH_FILTERS.map((filter) => {
          const active = filter.key === entity;
          return (
            <Pressable
              key={filter.key}
              onPress={() => onChangeEntity(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.pill, active && styles.pillActive]}>
              <Ionicons
                name={filter.icon}
                size={13}
                color={active ? Colors.onAccent : Colors.textSecondary}
              />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontWeight: '600',
    padding: 0,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.elevated,
  },
  pillActive: {
    backgroundColor: Colors.accent,
  },
  pillText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  pillTextActive: {
    color: Colors.onAccent,
  },
});
