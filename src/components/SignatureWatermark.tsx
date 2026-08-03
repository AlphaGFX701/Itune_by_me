/**
 * Subtle footer credit — "KMUTNB CED iTune • Thanadon Jaimuang".
 *
 * Deliberately low-contrast: it should read as a watermark, never compete with
 * the UI it sits under.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';

export function SignatureWatermark({
  style,
  align = 'center',
}: {
  style?: StyleProp<ViewStyle>;
  align?: 'center' | 'left';
}) {
  return (
    <View style={[styles.container, align === 'left' && styles.left, style]} pointerEvents="none">
      <Text style={styles.text} numberOfLines={1}>
        {Brand.watermark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  left: {
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.1,
    color: Colors.text,
    opacity: 0.28,
  },
});
