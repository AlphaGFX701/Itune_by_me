/**
 * Local persistence for favourites and recently played.
 *
 * There is no backend, so AsyncStorage is the source of truth. A tiny in-memory
 * cache plus a listener set lets every screen re-render the instant a heart is
 * tapped anywhere else in the app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { Track } from '@/lib/itunes';

const FAVORITES_KEY = '@kmutnb_ced_itune/favorites/v1';
const RECENTS_KEY = '@kmutnb_ced_itune/recents/v1';
const MAX_RECENTS = 20;

type Listener = () => void;

const listeners = new Set<Listener>();
let favoritesCache: Track[] | null = null;
let recentsCache: Track[] | null = null;
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

async function readList(key: string): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Track[]) : [];
  } catch {
    // Corrupt payload — start clean rather than crashing the screen.
    return [];
  }
}

async function writeList(key: string, value: Track[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable; the in-memory cache still keeps the session usable.
  }
}

/** Loads both lists once per app run. Safe to call repeatedly. */
export async function hydrateLibrary(): Promise<void> {
  if (hydrated) return;
  const [favorites, recents] = await Promise.all([
    readList(FAVORITES_KEY),
    readList(RECENTS_KEY),
  ]);
  favoritesCache = favorites;
  recentsCache = recents;
  hydrated = true;
  emit();
}

export function getFavoritesSync(): Track[] {
  return favoritesCache ?? [];
}

export function getRecentsSync(): Track[] {
  return recentsCache ?? [];
}

export function isFavoriteSync(id: string): boolean {
  return (favoritesCache ?? []).some((track) => track.id === id);
}

export async function getFavorites(): Promise<Track[]> {
  await hydrateLibrary();
  return getFavoritesSync();
}

export async function getRecentlyPlayed(): Promise<Track[]> {
  await hydrateLibrary();
  return getRecentsSync();
}

/** Adds or removes the track. Resolves to the new favourite state. */
export async function toggleFavorite(track: Track): Promise<boolean> {
  await hydrateLibrary();
  const current = getFavoritesSync();
  const exists = current.some((item) => item.id === track.id);
  const next = exists
    ? current.filter((item) => item.id !== track.id)
    : [track, ...current];

  favoritesCache = next;
  emit();
  await writeList(FAVORITES_KEY, next);
  return !exists;
}

export async function addRecentlyPlayed(track: Track): Promise<void> {
  await hydrateLibrary();
  const next = [track, ...getRecentsSync().filter((item) => item.id !== track.id)].slice(
    0,
    MAX_RECENTS
  );
  recentsCache = next;
  emit();
  await writeList(RECENTS_KEY, next);
}

export async function clearRecentlyPlayed(): Promise<void> {
  recentsCache = [];
  emit();
  await writeList(RECENTS_KEY, []);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Live view of the stored library. Any `toggleFavorite` / `addRecentlyPlayed`
 * call anywhere in the app re-renders every consumer of this hook.
 */
export function useLibrary() {
  const [snapshot, setSnapshot] = useState(() => ({
    favorites: getFavoritesSync(),
    recents: getRecentsSync(),
    ready: hydrated,
  }));

  useEffect(() => {
    const sync = () =>
      setSnapshot({
        favorites: getFavoritesSync(),
        recents: getRecentsSync(),
        ready: hydrated,
      });

    const unsubscribe = subscribe(sync);
    hydrateLibrary().then(sync);
    return unsubscribe;
  }, []);

  return snapshot;
}

/** Convenience wrapper for a single track's heart button. */
export function useIsFavorite(trackId: string | undefined) {
  const { favorites } = useLibrary();
  const isFavorite = !!trackId && favorites.some((track) => track.id === trackId);

  const toggle = useCallback(
    (track: Track) => toggleFavorite(track),
    []
  );

  return { isFavorite, toggle };
}
