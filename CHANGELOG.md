# Changelog

## 2026-05-04 — Bug fixes, UI amendments, and new features (brief v1)

### Bug fixes
- **Sleep time calculation** — `addMinutes` in `lib/dayBoundary.ts` was producing negative hours and minutes (e.g. "-2:-30am") when the result crossed midnight. Fixed with proper double-modulo normalisation. `subtractHours` and all bedtime displays now correctly wrap (e.g. 7:00am wake → 10:30pm bedtime).
- **Galaxy month view column misalignment** — month grid was built with `flexWrap: 'wrap'` and percentage widths, causing floating-point rounding to push cells into the wrong column. Replaced with explicit rows of 7 using `flex: 1` per cell — no more layout drift regardless of screen width.
- **Inconsistent capitalisation** — audited and lowercased all UI text across every onboarding screen (welcome, name, mood, science, wake-time, movement, breathwork, evening, notifications, project, start-date, handoff) and the home screen. Exceptions: user's name and "Pulsare" as a proper noun.
- **Habit completion animation driver conflict** — `scaleAnim` (native driver) and `fillAnim` (JS driver) were both applied to the same `Animated.View`, which React Native forbids. Changed scale animation to `useNativeDriver: false` to match the fill animation. This also resolved the related tick-reset bug caused by the animation error triggering a component recovery cycle.

### UI amendments
- **Sleep note repositioned** — moved from above the week strip to the very bottom of the home screen scroll (above the nav bar), with 24pt top padding. Relabelled: *"to keep your [wake time] anchor, aim to be in bed by [bedtime]. sleep is where the repair happens."* Outfit 300, tertiary colour.
- **Habit row spacing** — tightened to `minHeight: 56` per row. Group labels now have `marginTop: 20` / `marginBottom: 8` for clearer visual grouping.
- **Galaxy week view day labels** — added single-letter day label (M T W T F S S) above each star, date number below. Today's column renders label and date in secondary colour (`#bab5ac`).
- **Star containers fixed height** — wrapped all `StarMark` instances in fixed-size containers to prevent layout shift on state change: 32×32pt in the home screen week strip, 40×40pt in the galaxy week view, 28×28pt in the galaxy month view.

### New features
- **Habit completion feedback (Feature 1)** — tapping a habit now triggers a gentle press response (circle scales to 0.92 then back to 1.0, 80+120ms). A short personalised acknowledgement string fades in beneath the habit name 200ms after tap and fades out after 2 seconds. Scale animation skipped if `prefers-reduced-motion` is enabled. Fallback strings per habit; overridden by AI-generated copy if available.
- **User-defined habit labels (Feature 2)** — movement, breathwork, and evening onboarding screens now show an optional *"what do you call this?"* text input after a selection is made. The user's label (e.g. "my walk", "swimming", "the sigh") is stored as `userLabel` on the habit record and overrides the default label everywhere it appears (home screen, learn screen, completion text, notifications).
- **AI-generated personalised copy (Feature 3)** — immediately after onboarding completes, a single Anthropic API call generates personalised habit explanations, completion acknowledgement strings, and 5 greeting variations for the home screen. Runs silently in the background; result stored in MMKV as `personalisedCopy`. Falls back to default strings if generation fails — no error is ever surfaced to the user. API key read from `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env` (gitignored).
- **Galaxy neuroscience concept card (Feature 4)** — a condensed weekly concept card now appears beneath the stats row on the galaxy screen (both week and month views). Shows the concept title and one-sentence definition, phase-sequenced for weeks 1–3. "read more →" navigates to the Learn tab.

---

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
