# Cosmic Web — Claude Code Handover

## Project

Pulsare is a React Native / Expo habit tracker. Dark-themed (`#0c0c0c` background), serif + Outfit fonts, iOS build + PWA (Vercel). Galaxy metaphor: every completed day earns a star. Most recent commit (May 19): added PWA web target (platform-split notifications, vercel.json, web/manifest.json).

## Goal

Replace the **month tab** in `app/(tabs)/galaxy.tsx` with a **"cosmic web"** layout — 2D absolute-positioned stars connected by SVG filament lines, like large-scale cosmic structure. Week tab and Anchors tab stay untouched.

---

## Current state of relevant files

### `components/galaxy/StarMark.tsx`
Renders a single star. Five states: `full` (day completed), `partial` (some habits), `missed` (ghost), `return` (came back after missing, teal), `future` (outline only). Uses PNG assets from `assets/stars/` (star-full.png, star-partial.png, star-ghost.png, star-return.png, all with @2x/@3x). SVG fallback exists but `STAR_PNGS_READY = true` so PNGs always used. Accepts `size` prop override and `isToday` (1.2× multiplier). **Do not modify this file.**

### `app/(tabs)/galaxy.tsx`
Three tabs: `week` | `month` | `anchors`.

- **week**: `flexDirection: 'row'` strip of 7 stars with day letter above, date number below. Past days are `TouchableOpacity` → opens `PastDayEditSheet`. There's a `deterministicOffset` function that applies ±3px transform — visually invisible noise.
- **month**: Standard 7-column calendar grid (`monthWeekRow` = `flexDirection: 'row'`, each cell `flex: 1, aspectRatio: 1`). Same invisible ±3px jitter. **This is what we're replacing.**
- **anchors**: Per-habit list with 7-day sparkline of mini stars and lifetime completion count.

Key state: `stats: Record<string, DayStats>` — loaded via `loadStats()` on focus. `DayStats = { date, state: StarState, habitsComplete, habitsTotal }`. `dateRangeFromStart(user.startDate)` gives all dates since start.

Key imports already in file: `useWindowDimensions` is NOT imported yet — add it. `react-native-svg` is NOT imported yet — add it. `dateRangeFromStart`, `getLogicalDate`, `parseDate` are already imported.

---

## Implementation

### 1. New file: `components/galaxy/CosmosCanvas.tsx`

```tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import StarMark from '@/components/galaxy/StarMark';
import { Colors } from '@/constants/colors';
import type { DayStats, StarState } from '@/types';

interface Props {
  dates: string[];           // all dates since startDate (dateRangeFromStart output)
  stats: Record<string, DayStats>;
  today: string;
  canvasWidth: number;
  onPressStar: (date: string) => void;
}

const CANVAS_HEIGHT = 360;
const MARGIN = 20;
const FILAMENT_THRESHOLD = 90;
const FILAMENT_MAX_OPACITY = 0.14;

// xorshift32 seeded PRNG
function xorshift(seed: number): number {
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 0xffffffff;
}

function dateToSeed(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h * 31 + date.charCodeAt(i)) & 0xffffffff;
  }
  return h === 0 ? 1 : h; // xorshift breaks on 0
}

function computePositions(
  dates: string[],
  w: number,
  h: number,
): Record<string, { x: number; y: number }> {
  const n = dates.length;
  if (n === 0) return {};
  const usableW = w - MARGIN * 2;
  const usableH = h - MARGIN * 2;
  const cols = Math.ceil(Math.sqrt(n * (usableW / usableH)));
  const rows = Math.ceil(n / cols);
  const cellW = usableW / cols;
  const cellH = usableH / rows;

  const result: Record<string, { x: number; y: number }> = {};
  dates.forEach((date, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let seed = dateToSeed(date);
    const rx = xorshift(seed);
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const ry = xorshift(seed === 0 ? 1 : seed);
    result[date] = {
      x: MARGIN + col * cellW + cellW * 0.1 + rx * cellW * 0.8,
      y: MARGIN + row * cellH + cellH * 0.1 + ry * cellH * 0.8,
    };
  });
  return result;
}

const STAR_SIZE: Record<StarState, number> = {
  full: 6.5,
  return: 7,
  partial: 3.8,
  missed: 2,
  future: 2.2,
};

const PRESENT_STATES = new Set<StarState>(['full', 'partial', 'return']);

export default function CosmosCanvas({ dates, stats, today, canvasWidth, onPressStar }: Props) {
  const positions = useMemo(
    () => computePositions(dates, canvasWidth, CANVAS_HEIGHT),
    [dates, canvasWidth],
  );

  const filaments = useMemo(() => {
    const presentDates = dates.filter(d => {
      const state = d === today ? stats[d]?.state ?? 'future' : stats[d]?.state ?? 'future';
      return PRESENT_STATES.has(state) || d === today;
    });
    const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    for (let i = 0; i < presentDates.length; i++) {
      for (let j = i + 1; j < presentDates.length; j++) {
        const a = positions[presentDates[i]];
        const b = positions[presentDates[j]];
        if (!a || !b) continue;
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < FILAMENT_THRESHOLD) {
          lines.push({
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            opacity: (1 - dist / FILAMENT_THRESHOLD) * FILAMENT_MAX_OPACITY,
          });
        }
      }
    }
    return lines;
  }, [dates, positions, stats, today]);

  return (
    <View style={{ width: canvasWidth, height: CANVAS_HEIGHT, position: 'relative' }}>
      {/* Filament layer — behind stars, eats no touches */}
      <Svg
        width={canvasWidth}
        height={CANVAS_HEIGHT}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {filaments.map((l, i) => (
          <Line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={Colors.textPrimary}
            strokeWidth={0.5}
            strokeOpacity={l.opacity}
          />
        ))}
      </Svg>

      {/* Star layer */}
      {dates.map(date => {
        const pos = positions[date];
        if (!pos) return null;
        const isToday = date === today;
        const s = stats[date];
        const state: StarState = s?.state ?? (date <= today ? 'missed' : 'future');
        const starSize = isToday ? 9 : STAR_SIZE[state];
        const isPast = date < today;

        const star = (
          <View style={{ width: 44, height: 44, position: 'absolute', left: pos.x - 22, top: pos.y - 22, alignItems: 'center', justifyContent: 'center' }}>
            {isToday && (
              <View style={{
                position: 'absolute',
                width: 18, height: 18,
                borderRadius: 9,
                borderWidth: 0.5,
                borderColor: Colors.textPrimary,
                opacity: 0.12,
              }} />
            )}
            <StarMark state={state} size={starSize} />
          </View>
        );

        if (isPast) {
          return (
            <TouchableOpacity
              key={date}
              style={{ position: 'absolute', left: pos.x - 22, top: pos.y - 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => onPressStar(date)}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={`edit ${date}`}
            >
              {isToday && (
                <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 0.5, borderColor: Colors.textPrimary, opacity: 0.12 }} />
              )}
              <StarMark state={state} size={starSize} />
            </TouchableOpacity>
          );
        }
        return (
          <View key={date} style={{ position: 'absolute', left: pos.x - 22, top: pos.y - 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            {isToday && (
              <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 0.5, borderColor: Colors.textPrimary, opacity: 0.12 }} />
            )}
            <StarMark state={state} size={starSize} />
          </View>
        );
      })}
    </View>
  );
}
```

---

### 2. Changes to `app/(tabs)/galaxy.tsx`

**Add imports:**
```ts
import { useWindowDimensions } from 'react-native'; // add to existing RN import
import CosmosCanvas from '@/components/galaxy/CosmosCanvas';
```

**In `GalaxyScreen()`**, add:
```ts
const { width: screenWidth } = useWindowDimensions();
const canvasWidth = screenWidth - canvasPaddingH * 2;
// dateRangeFromStart is already called in loadStats; expose it in render:
const allDates = user ? dateRangeFromStart(user.startDate) : [];
```

**Replace the month tab block** (`{tab === 'month' && ( ... )}`):
```tsx
{tab === 'month' && (
  <View style={{ paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }}>
    <CosmosCanvas
      dates={allDates}
      stats={stats}
      today={today}
      canvasWidth={canvasWidth}
      onPressStar={(date) => setEditDate(date)}
    />
  </View>
)}
```

The concept card (`{tab !== 'anchors' && ...}`) already shows for the month tab — leave it, it'll show below the canvas.

---

## Gotchas

- **`react-native-svg` on web**: works fine, already used in `StarMark.tsx` (SVG fallback path). No extra config needed.
- **SVG `pointerEvents="none"`**: On web this maps to the CSS property correctly via react-native-svg. On native it's the RN prop. Both work with `pointerEvents="none"` on the `<Svg>` element.
- **No `react-native-reanimated`**: Not in package.json. Don't add it. Use `Animated` from `react-native` if entrance animations are needed later.
- **`useWindowDimensions` vs `onLayout`**: `useWindowDimensions` is fine here — canvas width = screen width minus known padding, no dynamic layout needed.
- **`dateRangeFromStart` already imported** in galaxy.tsx — just call it in the render body, not just in `loadStats`.
- **xorshift breaks on seed=0** — guard with `seed === 0 ? 1 : seed` (included above).
- **Filament O(n²)**: fine up to ~200 days (~20k pairs). Beyond that, consider spatial bucketing — not needed now.
- **`canvasPaddingH` is `insets.left + 20`** — already defined in the screen. Use it for both left and right padding symmetrically when computing `canvasWidth`.
