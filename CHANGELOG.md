# Changelog

## 2026-06-09 — Bug fixes: status bar, data consistency, habit editing

### Bug fixes

- **PWA status bar white bar on iOS** — the iOS status bar area showed a white strip at the top of the screen when the app was installed as a PWA. Root cause: the HTML `<body>` element had no background colour, so the dark background only existed at the React Native view layer — not at the document level where the translucent status bar overlay reads from. Fixed by injecting `html, body { background-color: #0c0c0c; }` via the `<Head>` component in `_layout.tsx`.

- **Galaxy week and month views ignoring retroactively logged days** — the `loadStats` function in `galaxy.tsx` built the stats map using only `dateRangeFromStart(user.startDate)`. Any date in the current week or month that predated the official start date was absent from the map and fell back to `'missed'`, even if a log entry existed. The anchors tab was unaffected because it reads `getLogEntry` directly rather than going through the stats map. Fixed by extending the stats map to cover the union of the official date range, the current week, and the current month.

- **Days present counter and streak ignoring retroactively logged days** — `getPresentDaysCount` and `recalculateStreak` in `presence.ts` both iterated only over `dateRangeFromStart(user.startDate)`, so retroactively edited days before the start date were silently excluded. This caused the "days present" counter and streak to disagree with the anchors sparkline and galaxy views. Fixed by introducing a `getEffectiveDates` helper that takes the union of the official date range and all dates present in the log (`getAllLogDates`), and using it in both functions.

- **Editing restricted to custom habits only** — long-press edit was gated on `habit.isCustom` in `HabitRow`, `index.tsx`, and `handleSaveHabit`. System habits (wake up alarm, morning light, etc.) could not be renamed. Fixed by removing the `isCustom` guard from the long-press handler and passing `onEdit` for all habits. For system habits, saving writes the new name to `userLabel` via `upsertHabit` (which is already the display override used everywhere). For custom habits, the existing `editCustomHabit` path is unchanged. The `CustomHabitSheet` hides the group, notification, and reason fields when editing a system habit — only the name field is shown.

---

## 2026-05-11 — Progressive depth, breathwork guide, galaxy anchors, and habit upgrades (brief v3)

### UI amendments

- **Custom habit editing (UI 1A)** — long-pressing a custom habit row now reveals two inline options: *"edit"* (above) and *"remove this habit"* (below). Tapping "edit" opens the same `CustomHabitSheet` bottom sheet pre-filled with the habit's current label and group. The habit ID is unchanged on save — log history is unaffected.
- **Custom habit notifications (UI 1B)** — the custom habit bottom sheet gains an optional *"add a reminder"* toggle. When enabled, a time picker appears defaulting to 90 minutes after wake time (morning) or wind-down time (evening). Notification copy: *"[habit label]. just this."* Scheduled via `expo-notifications` under the identifier `custom-habit`. Only one custom habit notification active at a time — adding a second shows an inline warning: *"you already have a reminder set for [habit]. adding this will replace it."* Custom habit notification is preserved when main notifications are rescheduled (e.g. from profile screen) by re-applying it at the end of `scheduleAllNotifications`.
- **Custom habit personal reason (UI 1C)** — a second optional field: *"why does this matter to you?"* (80 char max, placeholder *"for me, because..."*). Stored as `personalReason` on the habit record. Drives the Learn accordion body for that habit. If left blank, no Learn entry is shown — no gap or placeholder.
- **Onboarding resume from last screen (UI 2)** — `lastCompletedScreen` is written to storage at every screen advance (screens 1–12). On cold open, `app/index.tsx` reads this value and routes directly to the next uncompleted screen. Initial state for all screens is now pre-filled from storage where applicable (name, mood, wake time, project), so no data re-entry is required on resume. The `onboarding` key is not deleted on completion.

### New features

- **Week layer label — home screen (Feature 8A)** — a second line appears beneath the phase label in tertiary text (Outfit 300) for Phase 1 weeks 1–3: *"week 1 · presence"*, *"week 2 · timing"*, *"week 3 · stacking"*. Disappears from Phase 2 onward. Not tappable.
- **Milestone greetings (Feature 8D)** — on days 3, 7, and 21 since start date, a personalised greeting replaces the standard rotation for one appearance only. Tracked in `shownMilestones[]` on the `personalisedCopy` MMKV object. AI-generated with fallbacks: *"three days. something has started."* / *"one week. the anchor is holding."* / *"three weeks. that's neuroplasticity."* Standard rotation resumes the next day.
- **Learn screen concept cards replaced (Feature 8B)** — the three Phase 1 weekly concept cards (previously: circadian rhythm / cortisol awakening response / neuroplasticity) are replaced with three depth-layer cards that map to the weekly progression: **week 1 — presence**, **week 2 — timing**, **week 3 — stacking**. Each card retains the same format (title, one-sentence definition, 3–4 paragraphs, "new concept in N days" footer). Galaxy concept cards updated to match.
- **Anchoring stack pills — Week 3 Learn card (Feature 8C)** — the Week 3 concept card body ends with a *"your anchoring stack"* section. A horizontal scrollable row of pill cards shows the user's personalised if-then statements (pulled from the onboarding intentions screen). Pill style: Outfit 300, tertiary text, `#141414` surface, `#1c1c1c` 1px border, 12px corner radius. Read-only.
- **Breathwork guide screen (Feature 9)** — a full-screen modal accessible from the breathwork habit row via a subtle *"guide"* label (separate tap target from the completion circle). The guide shows: technique name (Playfair italic), purpose line (personalised or fallback), animated breath circle (120–200pt, `useNativeDriver: false`), phase label, phase countdown timer, and round counter. Three prescribed techniques rotate weekly across Phase 1:
  - Week 1: **physiological sigh** — double inhale (1.5s + 0.5s) + 4s exhale, 2 min minimum, ~20 rounds
  - Week 2: **cyclic sighing** — 4s inhale + 8s exhale, 3 min minimum, ~15 rounds
  - Week 3: **box breathing** — 4s inhale + 4s hold + 4s exhale + 4s hold, 4 min minimum, ~15 rounds
  - *"done"* button appears only after the minimum session time has elapsed. Completing via "done" marks the breathwork habit as complete. Swiping down before "done" does not complete the habit. Reduce-motion: static circle at mid-size, text-only phase labels.
- **Breathwork library — Learn screen (Feature 9)** — the breathwork accordion entry gains a *"breathwork library"* sub-section beneath the science copy. Technique cards unlock progressively by week (week 1: physiological sigh only; week 2 adds cyclic sigh; week 3 adds box breathing). Each card: technique name, 1-line purpose, *"try it →"* link that opens the guide without the habit-completion affordance. 4-7-8 shown as a locked card for non-evening-breathwork users.
- **Phase 2 breathwork interstitial (Feature 9)** — before the standard Phase 2 unlock prompt, a new screen asks *"you've tried three approaches. which felt most useful?"* Three technique tiles + *"I'll keep rotating"*. Selection stored as `breathworkDefault` on the user object.
- **Galaxy anchors tab (Feature 10)** — a fourth tab *"anchors"* added to the galaxy screen (week / month / year / anchors). Each row shows: full star PNG (20×20pt) left-aligned, habit label (Outfit 400), lifetime completion count (Playfair Display 400, 28pt, right-aligned), *"times"* label below count, and a 7-day sparkline (Mon–Sun, 12×12pt stars, today 14×14pt). Protocol habits listed first in order, then custom habits. Rows separated by 0.5px `#1c1c1c` rule. Empty state: *"your first completion will appear here."* Aggregation reads from `habitLog` at tab focus via `useFocusEffect`, cached in component state.
- **Stats row repositioned (Feature 10)** — the three-number stats row (days present / presence rate / current streak) moves from below the star canvas to above the tab row, giving it permanent visibility across all tabs.
- **Body check word pattern — weekly reflection (Feature 11)** — on the Sunday reflection screen, between the week's body check words and the first question, a single italic line surfaces the week's word pattern. Logic: mode of the 7 body check words (case-insensitive). If < 3 words logged, line is omitted. If no repeats: *"seven different words this week."* Otherwise: *"[word] shows up most this week."* No storage writes required — reads from `habitLog[date].bodyCheckWord`.

### AI copy generation

- **Extended `personalisedCopy.ts` prompt** — two new fields added to the JSON response:
  - `milestoneGreetings` — `{ day3, day7, day21 }`: short lowercase strings (3–10 words each), one per milestone. User's name included in at least one.
  - `breathworkIntros` — `{ physiological-sigh, cyclic-sigh, box-breathing }`: one line per technique, max 10 words, displayed below technique name in the guide screen.
- **Fallback strings** — used when `personalisedCopy` key is absent or API fails:
  - Day 3: *"three days. something has started."*
  - Day 7: *"one week. the anchor is holding."*
  - Day 21: *"three weeks. that's neuroplasticity."*
  - Physiological sigh: *"the fastest reset. two breaths is enough."*
  - Cyclic sigh: *"longer exhale. vagus nerve. three minutes."*
  - Box breathing: *"equal sides. prefrontal cortex on. four minutes."*

### Data model additions

- `Habit.customNotificationTime?: string | null` — HH:MM notification time for custom habits
- `Habit.personalReason?: string | null` — user's stated reason; drives Learn accordion body
- `User.breathworkDefault?: 'physiological-sigh' | 'cyclic-sigh' | 'box-breathing' | 'rotating' | null` — set at Phase 2 unlock
- `PersonalisedCopy.milestoneGreetings?`, `PersonalisedCopy.breathworkIntros?`, `PersonalisedCopy.shownMilestones?` — new keys on existing object
- `storage.getOnboardingLastScreen()` / `setOnboardingLastScreen(n)` — new helpers for onboarding resume

---

## Next session — what to build

### Phase 2 unlock flow (blocking Feature 9 interstitial)

The Phase 2 breathwork interstitial (`breathworkDefault` selection screen) is spec'd and the data model is ready, but it has nowhere to hook into. There is currently no code that transitions `user.currentPhase` from 1 → 2, no unlock screen, and no "standard unlock prompt." The interstitial is described in the brief as appearing *before* that standard prompt.

**What needs to be built first:**
1. Automated phase advancement — at week 4 (day 22+), detect on app open that the user is eligible for Phase 2 and transition `user.currentPhase` to 2 via `setUser`.
2. Standard Phase 2 unlock screen/modal — a brief moment of acknowledgement before handing off to the interstitial. (The `PhaseExplainerModal` currently shows phase info informally via the phase label tap — that's not the unlock flow.)
3. Breathwork interstitial — the existing `breathworkDefault` type on `User` is ready; the screen just needs building and wiring into the unlock sequence.

### Year tab on galaxy screen

The brief specifies tab order as **week / month / year / anchors** (with "anchors" as the *fourth* tab). The year tab does not exist — the current implementation is week / month / anchors. Year tab needs to be designed and built before anchors is repositioned as the fourth slot.

### Remaining onboarding pre-fill gaps

`movement.tsx`, `breathwork.tsx`, `evening.tsx`, and `notifications.tsx` save progress markers but do not pre-fill their selected state on resume. These screens should restore the user's previous choice visually when the onboarding flow is resumed mid-way.

### Testing pass against brief v3 checklist

Several checklist items have dependencies on physical device or time-based conditions that weren't verifiable during implementation:
- Custom habit notification fires at the correct time (requires setting a 1-minute-from-now time and confirming it fires)
- Milestone greetings fire exactly once on days 3, 7, 21 — tested via developer mode retroactive start date
- `shownMilestones` persists across app closes
- Breathwork guide swipe-down does not complete the habit — tab circle remains incomplete on return
- Reduce-motion: breathwork guide shows static circle, no animation

---

## 2026-05-06 — Past day editing, falloff loop fix

### Bug fixes
- **`index.tsx` — "I'm back" button stuck in falloff loop** — after pressing "I'm back" on the falloff screen, `handleBack()` marked today as `isReturnDay` and navigated to `/(tabs)`. But `load()` on the home screen fired immediately via `useFocusEffect` and called `isFallOff()`, which only checks days *before* today — so the consecutive missed days were still there and the app redirected straight back to `/falloff`. Fixed by checking `todayEntry?.isReturnDay` before redirecting: if today is already marked as a return day, the falloff redirect is skipped.

### New features
- **Past day editing** — users can now tap any past day to edit its habit completions and body check word. Entry points are:
  - **Home screen week strip** — tapping any day in the current week that is before today opens the edit sheet.
  - **Galaxy screen (week and month views)** — tapping any past star (strictly before today, on or after start date) opens the edit sheet.
- **`PastDayEditSheet` component** — new bottom modal sheet (`components/PastDayEditSheet.tsx`) shared across both entry points. Shows the full date, habit toggles for morning and evening groups, and a body check word field. Saves changes immediately on each toggle. Calls `recalculateStreak()` on close so streak and presence stats update correctly.
- **`WeekStrip` — optional `onDayPress` prop** — past-day cells become `TouchableOpacity` when `onDayPress` is provided; today and future cells remain non-interactive. Fully backward-compatible.

---

## 2026-05-05 — Automatic lowercase input, AI explainer for custom habits

### Bug fixes
- **`index.tsx` — body check word input auto-capitalises** — the body check text field was capitalising user input by default. Added `autoCapitalize="none"` and an `onChangeText` wrapper that calls `.toLowerCase()` so input always stays lowercase.

### New features
- **`learn.tsx` — AI-generated explainer for custom habits** — when a user adds a custom habit, `generateCustomHabitLearnContent` is called immediately after creation to fetch a personalised `reframe` and `science` blurb from the Claude API (Haiku). The learn screen polls every 2 seconds until the content arrives and then displays it in the accordion, replacing the *"preparing your explainer..."* placeholder. Falls back gracefully if the API key is absent or the request fails.

---

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
