# Pulsare PWA Plan

Converting the existing Expo + React Native Web app into an installable PWA.
The foundation is already in place (`react-native-web`, `expo start --web` script).
This is additive — one codebase, web as a second target.

Notifications are deferred until after the experience is solid.

---

## Phase 1 — Web Baseline
**Goal:** `expo start --web` boots and all screens are navigable without crashes.

### 1.1 Guard `expo-notifications` at the module boundary
`lib/notifications.ts` imports `expo-notifications` at the top level — this will crash the web build.
Wrap the entire module with a `Platform.OS !== 'web'` guard, or split into `notifications.native.ts` / `notifications.web.ts` stubs.

All call sites in `app/(tabs)/index.tsx` that call notification functions must also be guarded:
- `scheduleNeverMissTwiceNudge(user)` in the `useEffect`
- `scheduleCustomHabitNotification(...)` in `handleSaveHabit`
- `cancelCustomHabitNotification()` in `handleRemoveHabit` and `handleSaveHabit`

### 1.2 Onboarding notifications screen
`app/onboarding/notifications.tsx` — the screen itself is fine (just a TimePicker UI, saves times to storage). It does not call `expo-notifications` directly. Keep the screen as-is; it still collects wake/wind-down times used elsewhere. Skip wiring up actual notification scheduling on web.

### 1.3 Verify `expo-splash-screen` on web
`SplashScreen.preventAutoHideAsync()` in `_layout.tsx` — Expo's web runtime should no-op this gracefully but confirm it doesn't throw. If it does, wrap in a `Platform.OS !== 'web'` check.

### 1.4 AppState on web
`app/(tabs)/index.tsx` uses `AppState` to reload when foregrounded. On web, `background`/`inactive` never fire — only `active`. The existing `setInterval` fallback handles this fine, so no change needed. Just confirm the screen reloads on tab focus (it does, via `useFocusEffect`).

### 1.5 Smoke-test all routes
Walk every screen in the browser and confirm no white screens or console errors:
- Onboarding flow (all 14 screens)
- Main tabs: today, galaxy, learn
- Profile (via settings icon)
- Falloff screen
- Reflection modal

---

## Phase 2 — PWA Shell
**Goal:** Passes PWA installability criteria. "Add to Home Screen" prompt appears on Android Chrome. iOS Safari shows the option manually.

### 2.1 Update `app.json` web section
Replace the minimal `web` block with:

```json
"web": {
  "favicon": "./assets/favicon.png",
  "bundler": "metro",
  "output": "static",
  "name": "Pulsare",
  "shortName": "Pulsare",
  "description": "A habit app built around your nervous system.",
  "themeColor": "#0c0c0c",
  "backgroundColor": "#0c0c0c",
  "display": "standalone",
  "orientation": "portrait"
}
```

### 2.2 PWA icons
Expo generates the manifest from app.json but needs icons at specific sizes.
Create `assets/pwa-icon-192.png` and `assets/pwa-icon-512.png` from the existing `icon.png`.
Reference them in app.json under `web.icons` (Expo supports this in SDK 50+).

### 2.3 iOS Safari meta tags
Expo's default `index.html` doesn't include all the Safari-specific PWA meta tags.
Create a custom `web/index.html` (Expo Metro bundler supports this as an override) and add:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Pulsare" />
<link rel="apple-touch-icon" href="/assets/pwa-icon-192.png" />
```

### 2.4 Verify manifest and service worker
After `expo export --platform web`, check:
- `manifest.json` is present in the build output
- `display: standalone` is set
- A service worker is registered (Expo generates one for static exports)

---

## Phase 3 — Web UX
**Goal:** Feels intentional on mobile browser, not like a stretched native app.

### 3.1 Max-width container for desktop
On desktop, the app will stretch to full viewport width.
Add a root wrapper in `app/_layout.tsx` that constrains to ~430px and centers on web:

```tsx
// Platform.OS === 'web' wraps content in a centred max-width container
```

On mobile browser (375–430px viewport) this has no visible effect, which is correct.

### 3.2 Tab bar bottom padding
`app/(tabs)/_layout.tsx` has `paddingBottom: 12` and `height: 64` — this was sized for the iOS home indicator.
On web there is no indicator, so this looks slightly too tall. Adjust with `Platform.select`.

### 3.3 Keyboard and scroll behaviour on web
- `keyboardShouldPersistTaps="handled"` on ScrollView works on web but test text inputs in onboarding (name, intentions, body check word) to confirm focus/blur works correctly.
- Remove `blurOnSubmit` behaviour differences if any are noticed.

### 3.4 BreathworkGuide (Animated + PanResponder)
`components/BreathworkGuide.tsx` uses `Animated` and `PanResponder` for the breathing circle animation.
`react-native-web` maps PanResponder to pointer events — test on mobile Chrome and desktop.
The dismiss swipe down gesture may need a fallback close button if PanResponder doesn't feel right on web.

### 3.5 TimePicker on web
`components/ui/TimePicker.tsx` uses a custom `Modal` with up/down arrows — works on web.
Test that the modal positions correctly at the bottom of the viewport (not fixed relative to a scroll container).

### 3.6 Galaxy tab
`app/(tabs)/galaxy.tsx` uses `react-native-svg` (via `StarMark`) — this has full web support.
Smoke test the week/month/anchors tab views and confirm star rendering is correct.

---

## Phase 4 — Deploy
**Goal:** Live on HTTPS, installable from a real URL.

### 4.1 Static export
```bash
npx expo export --platform web
```
Output goes to `dist/`. This is a fully static site.

### 4.2 Host on Vercel (recommended)
- Connect the repo to Vercel
- Set build command: `npx expo export --platform web`
- Set output directory: `dist`
- Vercel provides HTTPS automatically — required for PWA install and service workers

### 4.3 Test install flow
- **Android Chrome**: visit URL → three-dot menu → "Add to Home Screen" (or the automatic install banner)
- **iOS Safari**: visit URL → Share → "Add to Home Screen"
- Confirm: launches full-screen (no browser chrome), dark background matches splash, icon appears correctly

### 4.4 Verify storage persistence
After installing and reopening: confirm onboarding state, habits, and log entries persist.
`AsyncStorage` on web uses `localStorage` — data survives tab closes but is origin-scoped.

---

## Deferred

- **Push notifications** — `expo-notifications` has web support but iOS Safari PWA notifications are flaky (iOS 16.4+ only, require explicit user permission per-session). Revisit once the experience is solid.
- **Offline mode** — the static export + service worker gives basic caching, but a full offline-first strategy (cache storage for habit data) can come later.
