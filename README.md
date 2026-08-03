# 🎵 KMUTNB CED iTune

A premium, Spotify-inspired music discovery app built with **Expo SDK 57**, **React Native**, and the **iTunes Search API**.

> **KMUTNB CED iTune** — Music discovery powered by the iTunes API  
> *by Thanadon Jaimuang*

---

## ✨ Features

### 🏠 **Home Screen**
- **Curated shelves**: Popular tracks, Thai hits, K-pop, Hip-hop, Rock, Chill & Study
- **Jump-back-in cards**: Resume recently played tracks
- **Pull-to-refresh**: Keep shelves up to date
- Branded header with monogram + tagline

### 🔍 **Search**
- Real-time iTunes API search (300ms debounce)
- Filter: Songs or Music Videos
- Browse chips: Quick access to genres
- Ranked results with play count

### 📚 **Library**
- **Favorites**: Heart any song; stored locally via AsyncStorage
- **Recently Played**: Auto-tracked when you hit play
- Tab filter for quick switching
- Clear history, play all actions
- Link to About / credits

### ▶️ **Now Playing**
- Full-screen player with blurred artwork backdrop
- **Audio playback**: 30-second iTunes previews via `expo-audio`
- **Music videos**: Toggle to native video player (`expo-video`) for `.musicVideo` results
- **Draggable seek bar**: Smooth scrubbing on the UI thread (Gesture.Pan)
- Progress time + total duration
- Play / Pause / Next / Previous controls
- Heart button for instant favoriting
- Subtle watermark footer credit

### 🎨 **Design System**
- Dark theme (Spotify-inspired): `#121212` background, `#1DB954` accent green
- Smooth animations: press-scale cards, heart-pop favorites, animated splash
- Gradient headers & blurred components
- Responsive layout for all screen sizes
- Accessible touch targets & semantic labels

### 💾 **Branding**
- **Animated splash screen**: Monogram spring, wordmark rise, rule sweep (750ms intro)
- **Header logos**: Recurring monogram + app name on Home & Library
- **About screen**: Credits, version, author, institution, built-with tech stack
  - Easter egg: Tap the author signature for a 10-particle heart/sparkle burst
- **Footer watermark**: "KMUTNB CED iTune • Thanadon Jaimuang" on Now Playing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/AlphaGFX701/Itune_by_me.git
   cd Itune_by_me
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npx expo start
   ```

4. **Open in your device**
   - **Expo Go** (easiest): Scan the QR code with your phone
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Web**: Press `w` in the terminal

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Expo SDK 57, React Native 0.86 |
| **Navigation** | Expo Router (file-based) |
| **Playback** | `expo-audio` (30s previews), `expo-video` (music videos) |
| **State** | React Context (PlayerContext), AsyncStorage (Favorites & History) |
| **Animations** | `react-native-reanimated` 4, `react-native-gesture-handler` |
| **UI** | `expo-linear-gradient`, `expo-blur`, `@expo/vector-icons`, `expo-image` |
| **Language** | TypeScript (strict mode) |
| **Lint** | ESLint (React Compiler enabled) |

### API
- **iTunes Search API** (public, no auth): `https://itunes.apple.com/search?term=...&entity=musicTrack|musicVideo&limit=50`
- Track metadata: artist, album, release date, genre
- Preview URLs: Direct HTTP links to 30-second MP3 samples
- Artwork: Upgraded from 100×100 to 600×600 via URL rewrite

---

## 📂 Project Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root Stack + PlayerProvider + splash overlay
│   ├── about.tsx                # Credits, version, branding, easter egg
│   ├── preview.tsx              # Now Playing screen (audio + video)
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab bar + MiniPlayer
│       ├── index.tsx            # Home (shelves, jump-back-in)
│       ├── search.tsx           # Search with debounce & filter
│       └── library.tsx          # Favorites + Recently Played
│
├── components/
│   ├── SplashBrand.tsx          # Splash animation + branding lockups
│   ├── Card.tsx                 # TrackCard, TrackRow, LikeButton + skeletons
│   ├── MiniPlayer.tsx           # Persistent playback bar above tabs
│   ├── SectionRow.tsx           # Horizontal shelf with title & CTA
│   ├── SearchBar.tsx            # Input + Song/Video filter pills
│   ├── EmptyState.tsx           # Friendly placeholders
│   └── SignatureWatermark.tsx   # Subtle footer credit
│
├── context/
│   └── PlayerContext.tsx        # Global playback state & controls
│
├── lib/
│   ├── itunes.ts                # iTunes API layer + type mapping
│   └── storage.ts               # AsyncStorage for favorites & recents
│
└── constants/
    └── theme.ts                 # Design tokens: colors, spacing, typography
```

---

## 🎮 Usage & Behavior

### Playback Flow
1. Tap a song card → starts playback via `PlayerContext` + opens Now Playing
2. The shelf becomes the queue; use Next/Previous to traverse it
3. At preview end (30s): auto-advance to next track or stop at queue end
4. Music videos use native player; audio controls are disabled

### Persistence
- **Favorites**: Heart button toggles; persists to AsyncStorage immediately
- **Recently Played**: Auto-tracked when preview starts; capped at 20 entries
- **Library syncs live**: Every screen sees updates from any other screen

### Gestures
- **Seek bar**: Drag horizontally to preview seek position; release to commit
- **Card press**: Scale 0.94× feedback; release animates spring back
- **Heart**: Pop animation (0.72 → 1.28 → 1 scale) on tap

---

## 🏗️ Architecture Highlights

### PlayerContext (Global Playback State)
- Single `expo-audio` player instance for the app
- Managed lifecycle: auto-released when unmounted
- Auto-advance on `didJustFinish` (guarded per-track)
- Lock-screen controls metadata synced in real-time
- Music video detection: bypasses audio engine

### AsyncStorage Library
- In-memory cache synced with device storage
- Subscriber pattern: any screen mutation notifies all observers
- Safe recovery on corrupt payloads (doesn't crash)

### Debounced Search
- 300ms debounce on text input (300 chars/sec = smooth UX)
- Abort in-flight requests when new search fires
- Dedupes results by artist + title combo

### Animated Scrubber (Now Playing)
- Gesture.Pan on UI thread → no main-thread jank during seek
- Shared values drive fill + knob; JS thread reads via `.get()`
- Preview time updates; commit on gesture end

---

## 🎨 Design Decisions

### Dark Theme Only
Spotify-inspired palette; no light mode. Rationale: music apps are often used in low light; one theme = simpler, more focused.

### 30-Second Preview Loop
iTunes API enforces 30s samples. Auto-advance keeps the experience seamless; silent looping would feel like a bug.

### No Backend / No Auth
All state lives on-device via AsyncStorage. Favorites don't sync across devices, but avoids auth complexity and server costs.

### Reanimated 4 + Gesture Handler
React Compiler compatibility + smooth UI-thread animations. PanResponder would violate immutability rules.

---

## 📱 Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | ✅ Tested | Runs on iOS 13+ via Expo Go or dev client |
| Android | ✅ Tested | Runs on Android 5+ via Expo Go or dev client |
| Web | ⚠️ Partial | Navigation works; audio may not (browser CORS) |

---

## 🔧 Development

### TypeScript & Linting
```bash
npx tsc --noEmit        # Type check
npx expo lint           # ESLint (React Compiler rules enabled)
```

### Build for Production
```bash
eas build --platform ios      # iOS
eas build --platform android  # Android
```

(Requires `eas-cli` and Expo account setup; see [Expo EAS docs](https://docs.expo.dev/eas))

### Debugging
- **Console logs**: Check terminal running `npx expo start`
- **Network**: Flipper Network Plugin (Expo docs)
- **Performance**: React DevTools Profiler (browser dev tools on web)

---

## 📝 License

MIT — Use freely. Enjoy the music! 🎵

---

## 👤 Credits

**KMUTNB CED iTune** — A student project by **Thanadon Jaimuang**  
*King Mongkut's University of Technology North Bangkok · Computer Education*

Music data & previews powered by **Apple's iTunes Search API** (public).

Built with ❤️ using **Expo** and **React Native**.

---

## 🙋 Support & Feedback

- Found a bug? Open an issue on GitHub
- Feature request? Discuss in Issues
- Questions? Check the Expo docs: https://docs.expo.dev

Happy listening! 🎧
