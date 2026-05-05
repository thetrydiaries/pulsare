# Changelog

## 2026-05-05 — Bug fixes and performance (senior engineering review)

### Bug fixes
- **`storage.ts` — fire-and-forget write errors silently swallowed** — all `AsyncStorage.setItem` and `removeItem` calls were unawaited and unhandled. Write failures (device full, OS error) would silently drop data. All writes now attach a `.catch` that logs the error. `initStorage()` is also now idempotent via a singleton promise — calling it twice no longer kicks off two concurrent `multiGet` reads.
- **`index.tsx` — stale `weekDates` closure in `useCallback`** — `load` captured the `weekDates` array from its render-time closure but only listed `today` in its dependency array. If the component re-rendered without `today` changing (e.g. any state update), `load` held a stale week and would populate the week strip with the wrong dates. `load` now computes `currentToday` and `currentWeekDates` directly inside the callback; dependency array is `[]`.
- **`index.tsx` — `scheduleNeverMissTwiceNudge` fired on every `load()` call** — `load` runs on focus, every AppState resume, and every 5-minute interval. When `isMissedOneDayOnly()` was true the notification was rescheduled on every tick. Moved to a one-shot `useEffect([], [])`.
- **`learn.tsx` — animation started during render** — `Animated.timing(...).start()` was called inside the component body guarded by a ref mutation, making it a side effect executed during render. This double-fires under Strict Mode and is incorrect under Concurrent Mode. Moved into `useEffect([isOpen])`.
- **`HabitRow.tsx` — `fillAnim` not synced on external state reset** — `fillAnim` was initialised from the `completed` prop but only updated via `handlePress`. When `load()` reset completion state from storage (e.g. app foregrounded the next day), the circle visual stayed stuck at the previous session's animation value. A `useEffect` now calls `fillAnim.setValue()` when the prop changes externally without triggering the tap animation sequence.
- **`HabitRow.tsx` — `ackAnim` sequences stacked on rapid taps** — rapid taps started new animation sequences without stopping the running one. Delayed callbacks from earlier sequences continued firing, causing the acknowledgement text to flash unpredictably. Added `ackAnim.stopAnimation()` before each new sequence.
- **`reflection.tsx` — dead code in `getSundayKey`** — the function computed a `sunday` variable that was immediately abandoned, then re-derived the same answer via a while loop. Dead block removed.
- **`dayBoundary.ts` — `daysAgo()` ignored the 3am logical boundary** — called between midnight and 3am without arguments, `new Date()` gives the calendar date while the logical date is still yesterday, producing off-by-one results. `daysAgo` now bases calculation on `getLogicalDate()`. The unused `from` parameter has been removed.
- **`personalisedCopy.ts` — no `response.ok` check before parsing** — a 4xx/5xx API response still called `.json()` and accessed `.content`, producing cryptic downstream errors swallowed by the outer `catch`. Now checks `response.ok` explicitly and returns early on failure.
- **`personalisedCopy.ts` — fragile JSON extraction** — the regex `` /```json|```/g `` missed uppercase fences and any leading prose. Now extracts the first `{...}` object from the raw response string, making it robust to any surrounding markdown or explanatory text.

### Performance
- **`presence.ts` — O(n) JSON parses per habit tap eliminated** — `getDayStats()` called `getUser()` and `getActiveHabitsForPhase()` (both `JSON.parse`) on every iteration of every loop in `getRangeStats`, `getPresentDaysCount`, `recalculateStreak`, and `getConsecutiveMissedDays`. On a 90-day user this was ~180 JSON parses per toggle tap. Introduced a private `computeDayStats(date, today, activeHabits)` helper — user and habits are now resolved once at each call site, not per date.
- **`learn.tsx` — `getPersonalisedCopy()` called per-row per-render** — each `HabitAccordionRow` independently called `getPersonalisedCopy()`, triggering a `JSON.parse` for every habit on every render. Lifted to the parent `LearnScreen`, fetched once, refreshed on focus, passed down as a prop.

---

## 2026-05-04 — UI amendments and new features (brief v2)

### UI amendments
- **Time-sensitive greeting (UI 1)** — greeting now reflects the actual time of day across four bands: *"good morning"* (5am–noon), *"good afternoon"* (noon–5pm), *"good evening"* (5pm–9pm), *"still up"* (9pm–5am). Re-evaluates on every app foreground event via the AppState listener. AI-generated personalised copy updated to produce five variations per band (`morning`, `afternoon`, `evening`, `latenight` keys). Falls back to the appropriate default per band — no empty greeting is ever shown.
- **Rename "wake anchor" → "wake up alarm" (UI 2)** — every user-facing instance of "wake anchor" replaced with "wake up alarm". `suggestedId: 'wake-anchor'` is unchanged for data continuity. Updated: home screen habit row label, Learn screen accordion, AI copy prompt instructions.

### New features
- **Custom habit — onboarding (Feature 5A)** — new screen inserted between the evening anchor screen and the notification times screen (new step 9 of 13). Prompts: *"is there something else you want to hold yourself to?"* Free-text field (40 char max). Morning/evening time-of-day toggle appears once the user starts typing. Button reads "add it" if a name is entered, "skip for now" if empty. If added, habit is created with `isCustom: true`, `suggestedId: null`, `locked: false`. Skipping leaves no habit record.
- **Custom habit — add post-onboarding (Feature 5B)** — a `+` in tertiary text sits below each habit group on the home screen, visible only when the user has fewer than 2 custom habits active in that group. Tapping opens a `CustomHabitSheet` bottom sheet (slide-up modal) with the same two-part input. Confirms with "add habit". Dismisses on tap outside or swipe down.
- **Custom habit — remove (Feature 5C)** — long pressing any custom habit row on the home screen reveals a *"remove this habit"* line in tertiary text beneath the habit name. Tapping it shows a confirmation: *"remove [habit name]?"* with "yes, remove it" / "keep it". On confirm, habit is marked `active: false` in storage; historical log entries are not altered. The same remove option appears inline on the profile screen under "your anchors".
- **Phase explainer modal (Feature 6)** — tapping the phase label in the home screen status bar opens a full-screen slide-up modal. Shows three phase cards (stabilise / build / raise the stakes) with week range, one-sentence description, and habit list. Phase 1 card uses the user's actual personalised habit labels. Current phase card has a teal border and a *"you are here"* label; upcoming phases are visually quieter. Phase 2 and 3 carry an *"unlocks at week 4/9"* label. Footer: *"phases unlock when you're ready — not on a timer."* Phase label has a 2pt indicator dot and ≥44pt tap target. Dismisses on swipe down or `×` tap.
- **Developer mode (Feature 7)** — tapping the app version number five times within 2 seconds activates developer mode for the current session (session-only, not persisted). An amber toast *"developer mode on"* appears for 2 seconds. A "dev tools" section (amber label) appears on the profile screen above the fine print with three options: (1) **set start date** — text input accepting YYYY-MM-DD, immediately recalculates week number, streak, and galaxy range; (2) **phase override** — three-segment control (1 / 2 / 3) that forces the app to render as a specific phase without writing to MMKV; (3) **reset everything** — confirmation alert that clears all data and navigates to the onboarding welcome screen.

---

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
