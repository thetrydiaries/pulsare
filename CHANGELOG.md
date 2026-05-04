# Changelog

## 2026-05-04 — Fix Expo Go compatibility

### Fixed
- **`react-native-mmkv` is not supported in Expo Go** (uses NitroModules). Replaced with `@react-native-async-storage/async-storage` 2.2.0.
- Rewrote `lib/storage.ts` with an in-memory cache backed by AsyncStorage. The synchronous API (`storage.getString`, `storage.set`, etc.) used by all screens is preserved exactly — no screen code needed to change.
- Added `initStorage()` async function that pre-loads all AsyncStorage data into the cache at app startup.
- Updated `app/_layout.tsx` to await `initStorage()` (alongside font loading) before rendering routes, so synchronous reads from the cache are always accurate.
- All "Route missing default export" warnings were caused by the MMKV crash — resolved by the above fix.

### Notes for native builds
- When building with EAS or `expo run:ios`, swap `@react-native-async-storage/async-storage` back to `react-native-mmkv` in `lib/storage.ts` for better performance. The API shape is identical.

---

## 2026-05-04 — Initial dev setup

### Fixed
- Removed `eas-cli` from `devDependencies` in `package.json` — EAS CLI should be installed globally, not as a project dependency. expo-doctor flagged this as a warning.

### Verified
- Metro bundler starts cleanly on `npx expo start`
- App structure is valid: expo-router v6 with `app/` directory, MMKV storage, Playfair Display + Outfit fonts
- No TypeScript config issues

### Notes
- CocoaPods not installed on this machine — only affects `expo run:ios` (native builds). Expo Go works fine without it.
- To test: run `npx expo start`, scan the QR code with Expo Go on your phone
