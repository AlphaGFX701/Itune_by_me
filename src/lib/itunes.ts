/**
 * iTunes Search API layer.
 *
 * Raw Apple field names (`trackName`, `artistName`, `artworkUrl100`, ...) never
 * escape this module — everything above it speaks in `Track`.
 *
 * Docs: https://performance-partners.apple.com/search-api
 */

const BASE_URL = 'https://itunes.apple.com/search';
const DEFAULT_COUNTRY = 'TH';
const REQUEST_TIMEOUT_MS = 12_000;

export type TrackKind = 'song' | 'music-video';

/** The only track shape the rest of the app knows about. */
export type Track = {
  id: string;
  artist: string;
  title: string;
  album: string;
  /** Artwork upgraded from Apple's 100x100 thumbnail. */
  coverUrl: string;
  /** 30-second preview. `null` when Apple has no preview for the item. */
  previewUrl: string | null;
  genre: string;
  /** ISO date string, or '' when missing. */
  releaseDate: string;
  kind: TrackKind;
  /** Preview length in seconds when known, otherwise 30 (Apple's default). */
  durationSeconds: number;
};

export type SearchEntity = 'musicTrack' | 'musicVideo';

export type SearchOptions = {
  entity?: SearchEntity;
  limit?: number;
  country?: string;
  signal?: AbortSignal;
};

/** Shape of a single `results[]` entry, kept private to this module. */
type ItunesRawResult = {
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  wrapperType?: string;
  kind?: string;
  artistName?: string;
  trackName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  previewUrl?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
};

export class ItunesError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ItunesError';
  }
}

/** Apple serves artwork at any square size if you swap the dimensions in the path. */
function upgradeArtwork(url: string | undefined, size: 300 | 600 = 600): string {
  if (!url) return '';
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/i, `/${size}x${size}bb.$1`);
}

function toTrack(raw: ItunesRawResult): Track | null {
  const id = String(raw.trackId ?? raw.collectionId ?? '');
  const title = raw.trackName?.trim();
  if (!id || !title) return null;

  return {
    id,
    title,
    artist: raw.artistName?.trim() || 'Unknown artist',
    album: raw.collectionName?.trim() || '',
    coverUrl: upgradeArtwork(raw.artworkUrl100 ?? raw.artworkUrl60),
    previewUrl: raw.previewUrl ?? null,
    genre: raw.primaryGenreName ?? '',
    releaseDate: raw.releaseDate ?? '',
    kind: raw.kind === 'music-video' ? 'music-video' : 'song',
    durationSeconds: raw.trackTimeMillis ? Math.round(raw.trackTimeMillis / 1000) : 30,
  };
}

/** Drops duplicates (Apple repeats tracks across albums) while keeping order. */
function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const track of tracks) {
    const key = `${track.artist.toLowerCase()}::${track.title.toLowerCase()}`;
    if (seen.has(key) || seen.has(track.id)) continue;
    seen.add(key);
    seen.add(track.id);
    out.push(track);
  }
  return out;
}

/**
 * Combines a caller-supplied abort signal with a timeout into one signal,
 * using the native `AbortSignal.timeout`/`AbortSignal.any` where available.
 *
 * The previous implementation wired this up manually with a second
 * `AbortController` and a forwarded `addEventListener('abort', ...)` — a
 * pattern WebKit has documented bugs with, where it can surface as a fetch
 * rejecting with a generic `TypeError: Load failed` on iOS Safari for
 * requests that never actually got sent. Letting the platform combine the
 * signals avoids that custom bookkeeping entirely.
 */
function combineSignal(timeoutMs: number, external?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!external) return timeoutSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([external, timeoutSignal]);
  }
  // Older engines without AbortSignal.any (pre iOS 17.4 / Chrome 116).
  const controller = new AbortController();
  const abort = () => controller.abort();
  external.addEventListener('abort', abort, { once: true });
  timeoutSignal.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

/** One request attempt. Never called directly — see `requestJson` for retry handling. */
async function requestJsonOnce(
  url: string,
  signal: AbortSignal | undefined,
  timeoutMs: number
): Promise<{ results?: unknown }> {
  const response = await fetch(url, { signal: combineSignal(timeoutMs, signal) });
  if (!response.ok) {
    throw new ItunesError(`iTunes responded with ${response.status}`);
  }
  return (await response.json()) as { results?: unknown };
}

/**
 * Fetches with one automatic retry. Mobile connections drop single requests
 * far more often than Wi-Fi — a lone timeout or a mid-request network switch
 * (e.g. cellular ⇄ Wi-Fi handoff) shouldn't surface as "can't connect".
 */
async function requestJson(url: string, signal?: AbortSignal): Promise<{ results?: unknown }> {
  const attempts = [REQUEST_TIMEOUT_MS, REQUEST_TIMEOUT_MS + 8_000];

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts.length; attempt++) {
    if (signal?.aborted) throw new ItunesError('Request cancelled');
    try {
      return await requestJsonOnce(url, signal, attempts[attempt]);
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error; // caller cancelled — let it bubble untouched
      if (attempt < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  if (lastError instanceof ItunesError) throw lastError;

  // Surface the raw browser error (e.g. "TypeError: Failed to fetch",
  // "AbortError") in the message itself — without a remote device to
  // inspect, this is the only diagnostic signal available for reports like
  // "search doesn't work on my Android phone".
  const detail =
    lastError instanceof Error
      ? `${lastError.name}: ${lastError.message}`
      : String(lastError);
  throw new ItunesError(`Could not reach the iTunes Store. (${detail})`, lastError);
}

/**
 * Search the iTunes Store.
 *
 * @example
 * const tracks = await searchMusic('bodyslam', { entity: 'musicVideo', limit: 20 });
 */
export async function searchMusic(term: string, opts: SearchOptions = {}): Promise<Track[]> {
  const query = term.trim();
  if (!query) return [];

  const { entity = 'musicTrack', limit = 25, country = DEFAULT_COUNTRY, signal } = opts;

  const url =
    `${BASE_URL}?term=${encodeURIComponent(query)}` +
    `&entity=${entity}&media=music&limit=${limit}&country=${country}`;

  const json = await requestJson(url, signal);
  const results = Array.isArray(json.results) ? (json.results as ItunesRawResult[]) : [];

  return dedupe(results.map(toTrack).filter((t): t is Track => t !== null && !!t.previewUrl));
}

/**
 * Home shelves seed. The Search API has no "charts" endpoint, so we fan out over a
 * handful of broad terms and merge them — Home is never empty before a search.
 */
const POPULAR_SEEDS = ['top hits', 'new music', 'trending pop', 'viral songs'];

export async function getTopSongs(opts: SearchOptions = {}): Promise<Track[]> {
  const { limit = 12, country = DEFAULT_COUNTRY, signal } = opts;

  const batches = await Promise.all(
    POPULAR_SEEDS.map((seed) =>
      searchMusic(seed, { limit, country, signal, entity: 'musicTrack' }).catch(() => [] as Track[])
    )
  );

  const merged = dedupe(batches.flat());
  if (merged.length === 0) {
    throw new ItunesError('Could not load popular tracks right now.');
  }
  return merged;
}

/** A Home shelf: a title plus the tracks that fill it. */
export type Shelf = {
  key: string;
  title: string;
  /** The search term this shelf expands into when tapped. */
  term: string;
  tracks: Track[];
};

/** The genre rows shown on Home, in display order. */
export const HOME_SHELVES: { key: string; title: string; term: string }[] = [
  { key: 'thai', title: 'Thai hits', term: 'thai pop' },
  { key: 'pop', title: 'Pop essentials', term: 'pop hits' },
  { key: 'hiphop', title: 'Hip-hop heat', term: 'hip hop' },
  { key: 'rock', title: 'Rock anthems', term: 'rock classics' },
  { key: 'chill', title: 'Chill & study', term: 'lofi chill' },
];

export async function getShelves(opts: SearchOptions = {}): Promise<Shelf[]> {
  const { limit = 12, country = DEFAULT_COUNTRY, signal } = opts;

  return Promise.all(
    HOME_SHELVES.map(async (shelf) => ({
      ...shelf,
      tracks: await searchMusic(shelf.term, {
        limit,
        country,
        signal,
        entity: 'musicTrack',
      }).catch(() => [] as Track[]),
    }))
  );
}

/**
 * Route params for `/preview`. Keeps the original app's flat `artist / track /
 * cover_url / preview_url` contract and carries the rest so Now Playing can
 * rebuild a full `Track` without a second network call.
 */
export type TrackParams = {
  id: string;
  artist: string;
  track: string;
  album: string;
  cover_url: string;
  preview_url: string;
  genre: string;
  release_date: string;
  kind: string;
  duration: string;
};

export function trackToParams(track: Track): TrackParams {
  return {
    id: track.id,
    artist: track.artist,
    track: track.title,
    album: track.album,
    cover_url: track.coverUrl,
    preview_url: track.previewUrl ?? '',
    genre: track.genre,
    release_date: track.releaseDate,
    kind: track.kind,
    duration: String(track.durationSeconds),
  };
}

/** Inverse of `trackToParams`. Tolerates Expo Router handing back `string[]`. */
export function paramsToTrack(params: Record<string, string | string[] | undefined>): Track | null {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? '';

  const id = first(params.id);
  const title = first(params.track);
  if (!id || !title) return null;

  return {
    id,
    title,
    artist: first(params.artist) || 'Unknown artist',
    album: first(params.album),
    coverUrl: first(params.cover_url),
    previewUrl: first(params.preview_url) || null,
    genre: first(params.genre),
    releaseDate: first(params.release_date),
    kind: first(params.kind) === 'music-video' ? 'music-video' : 'song',
    durationSeconds: Number(first(params.duration)) || 30,
  };
}

/** `1:04` style formatting used by the mini player and Now Playing. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** `2019` from an ISO release date, or '' when absent. */
export function releaseYear(releaseDate: string): string {
  return releaseDate ? releaseDate.slice(0, 4) : '';
}
