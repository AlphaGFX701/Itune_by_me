/**
 * Bottom tab bar — Home / Search / Library — plus the persistent mini player
 * that floats directly above it.
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { Colors, Layout, Spacing } from '@/constants/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarTotalHeight = Layout.tabBarHeight + insets.bottom;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          sceneStyle: { backgroundColor: Colors.background },
          tabBarStyle: {
            height: tabBarTotalHeight,
            paddingBottom: insets.bottom,
            paddingTop: Spacing.sm,
            backgroundColor: Colors.background,
            borderTopColor: Colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 0.2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={23} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={23}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <MiniPlayer bottom={tabBarTotalHeight + Spacing.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
