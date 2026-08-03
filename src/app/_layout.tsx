/**
 * KMUTNB CED iTune — root layout
 * by Thanadon Jaimuang
 *
 * Wraps the whole app in `PlayerProvider` and holds the animated brand splash
 * over the navigator until its intro finishes.
 */

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashBrand } from '@/components/SplashBrand';
import { Colors } from '@/constants/theme';
import { PlayerProvider } from '@/context/PlayerContext';
import { hydrateLibrary } from '@/lib/storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

const NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.background,
    primary: Colors.accent,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  const [brandIntroDone, setBrandIntroDone] = useState(false);

  useEffect(() => {
    // Warm the favourites/recents cache while the brand intro plays.
    hydrateLibrary().catch(() => {});
    // Hand off from the native splash to our own animated one right away.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleIntroFinish = useCallback(() => setBrandIntroDone(true), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={NavigationTheme}>
          <PlayerProvider>
            <View style={styles.root}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'fade',
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="preview"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
              </Stack>

              {/* Branding: animated cold-start wordmark, above everything. */}
              {!brandIntroDone && <SplashBrand onFinish={handleIntroFinish} />}
            </View>
          </PlayerProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
