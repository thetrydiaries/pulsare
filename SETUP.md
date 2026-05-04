# Pulsare — Dev Setup

## What you need first

1. **Expo account** — create one free at https://expo.dev/signup
2. **EAS CLI** — already installed as a dev dependency in this project
3. **Xcode** — for iOS simulator builds (Mac only)
4. **iPhone** (optional) — for on-device testing

---

## First-time setup

### 1. Log in to EAS

In your terminal, from the `pulsare` folder:

```bash
npx eas login
```

Enter your Expo account credentials.

### 2. Link the project to your Expo account

```bash
npx eas init
```

This creates an `extra.eas.projectId` in `app.json` automatically.

### 3. Build a development client (iOS simulator)

```bash
npx eas build --profile development --platform ios
```

This takes ~5–10 minutes. EAS builds it in the cloud.
When done, it gives you a `.tar.gz` — drag it into your Simulator app.

### 4. Start the dev server

```bash
npm start
```

Then press `i` to open in the iOS simulator.

---

## Day-to-day development

Once the dev client is installed on the simulator:

```bash
npm start
```

That's it. The dev client connects to your local Metro server — hot reload works normally.

---

## On-device testing (optional, later)

```bash
npx eas build --profile development-device --platform ios
```

You'll need your Apple Developer account registered in EAS first:
```bash
npx eas device:create
```

---

## Notes

- **Expo Go works for UI and flow testing** — storage has been swapped to AsyncStorage (with in-memory cache) so the app runs in Expo Go. Run `npx expo start` and scan the QR code. Note: local notifications are not supported in Expo Go — for notification testing, use the dev client build (instructions above). When building natively via EAS, swap the storage layer back to `react-native-mmkv` for better performance.
- **EAS CLI** — was previously a devDependency in this project but has been removed. Install it globally instead: `npm install -g eas-cli`
- **Star PNG assets** — when ready, drop the 12 files into `assets/stars/` using this naming convention (replacing the placeholder transparent PNGs already there):
  ```
  star-full@1x.png    star-full@2x.png    star-full@3x.png
  star-partial@1x.png star-partial@2x.png star-partial@3x.png
  star-ghost@1x.png   star-ghost@2x.png   star-ghost@3x.png
  star-return@1x.png  star-return@2x.png  star-return@3x.png
  ```
  All files should be white (`#ffffff`) on a transparent background — the app applies opacity and tint at render time. Then open `components/galaxy/StarMark.tsx` and set `STAR_PNGS_READY = true`. The component switches from SVG to PNG automatically.
- **Notifications on simulator** — local notifications work in the iOS simulator from iOS 16+.
