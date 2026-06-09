import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import StarMark from '@/components/galaxy/StarMark';
import { Colors } from '@/constants/colors';
import type { DayStats, StarState } from '@/types';

interface Props {
  dates: string[];
  stats: Record<string, DayStats>;
  today: string;
  canvasWidth: number;
  onPressStar: (date: string) => void;
}

const MARGIN = 24;
const MIN_CELL = 56;
const MAX_COLS = 8;

// Streak chain constants (primary layer — meaningful)
const STREAK_MAX_OPACITY = 0.75;
const STREAK_MIN_OPACITY = 0.45;

// Ambient web constants (secondary layer — depth/texture only)
const AMBIENT_THRESHOLD = 120;
const AMBIENT_MAX_OPACITY = 0.09;
const MAX_AMBIENT = 150;

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
  return h === 0 ? 1 : h;
}

function computeLayout(n: number, w: number): { cols: number; cellSize: number; canvasHeight: number } {
  if (n === 0) return { cols: 1, cellSize: MIN_CELL, canvasHeight: 280 };
  const usableW = w - MARGIN * 2;
  const cols = Math.min(MAX_COLS, Math.max(1, Math.floor(usableW / MIN_CELL)));
  const rows = Math.ceil(n / cols);
  const cellSize = usableW / cols; // square cells — isotropic jitter
  const canvasHeight = Math.max(280, Math.ceil(rows * cellSize) + MARGIN * 2);
  return { cols, cellSize, canvasHeight };
}

function computePositions(
  dates: string[],
  cols: number,
  cellSize: number,
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  dates.forEach((date, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let seed = dateToSeed(date);
    const rx = xorshift(seed);
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const ry = xorshift(seed === 0 ? 1 : seed);
    result[date] = {
      x: MARGIN + col * cellSize + cellSize * 0.1 + rx * cellSize * 0.8,
      y: MARGIN + row * cellSize + cellSize * 0.1 + ry * cellSize * 0.8,
    };
  });
  return result;
}

interface FilamentLine {
  x1: number; y1: number; x2: number; y2: number;
  opacity: number;
  strokeWidth: number;
}

// Map each present date to the length of its streak run.
// Used to scale chain line weight — longer streak = thicker, brighter line.
function computeStreakLengths(
  dates: string[],
  presentSet: Set<string>,
): Record<string, number> {
  const lengths: Record<string, number> = {};
  let runStart = -1;
  let runLen = 0;

  const commit = (end: number) => {
    for (let j = runStart; j < end; j++) {
      lengths[dates[j]] = runLen;
    }
  };

  for (let i = 0; i < dates.length; i++) {
    if (presentSet.has(dates[i])) {
      if (runLen === 0) runStart = i;
      runLen++;
    } else {
      if (runLen > 0) { commit(i); runLen = 0; }
    }
  }
  if (runLen > 0) commit(dates.length);

  return lengths;
}

// Primary layer: connect consecutive present days.
// Line weight and opacity scale with streak length so long runs read as bright constellations.
function computeStreakChains(
  dates: string[],
  presentSet: Set<string>,
  streakLengths: Record<string, number>,
  positions: Record<string, { x: number; y: number }>,
): FilamentLine[] {
  const lines: FilamentLine[] = [];

  for (let i = 0; i < dates.length - 1; i++) {
    const curr = dates[i];
    const next = dates[i + 1];
    if (!presentSet.has(curr) || !presentSet.has(next)) continue;

    const p1 = positions[curr];
    const p2 = positions[next];
    if (!p1 || !p2) continue;

    // Longer streak → thicker, brighter line
    const len = Math.max(streakLengths[curr] ?? 1, streakLengths[next] ?? 1);
    const t = Math.min(1, (len - 2) / 8); // 0 at len=2, 1 at len=10+
    const opacity = STREAK_MIN_OPACITY + t * (STREAK_MAX_OPACITY - STREAK_MIN_OPACITY);
    const strokeWidth = 1 + t * 1.2; // 1px at len=2 → 2.2px at len=10+

    lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, opacity, strokeWidth });
  }

  return lines;
}

// Secondary layer: spatial proximity web, present days only, very faint.
// Purely atmospheric — no meaning implied, just fills the canvas with depth.
function computeAmbientFilaments(
  presentDates: string[],
  positions: Record<string, { x: number; y: number }>,
): FilamentLine[] {
  const buckets = new Map<string, string[]>();

  for (const date of presentDates) {
    const pos = positions[date];
    if (!pos) continue;
    const bx = Math.floor(pos.x / AMBIENT_THRESHOLD);
    const by = Math.floor(pos.y / AMBIENT_THRESHOLD);
    const key = `${bx},${by}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(date);
  }

  const lines: FilamentLine[] = [];

  for (const date of presentDates) {
    const pos = positions[date];
    if (!pos) continue;
    const bx = Math.floor(pos.x / AMBIENT_THRESHOLD);
    const by = Math.floor(pos.y / AMBIENT_THRESHOLD);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighbors = buckets.get(`${bx + dx},${by + dy}`);
        if (!neighbors) continue;
        for (const neighbor of neighbors) {
          if (neighbor <= date) continue; // ISO ordering deduplicates pairs
          const npos = positions[neighbor];
          if (!npos) continue;
          const dist = Math.sqrt((pos.x - npos.x) ** 2 + (pos.y - npos.y) ** 2);
          if (dist < AMBIENT_THRESHOLD) {
            lines.push({
              x1: pos.x, y1: pos.y, x2: npos.x, y2: npos.y,
              opacity: (1 - dist / AMBIENT_THRESHOLD) * AMBIENT_MAX_OPACITY,
              strokeWidth: 0.5,
            });
          }
        }
      }
    }
  }

  if (lines.length <= MAX_AMBIENT) return lines;
  return lines.sort((a, b) => b.opacity - a.opacity).slice(0, MAX_AMBIENT);
}

const STAR_SIZE: Record<StarState, number> = {
  full:    20,
  return:  22,
  partial: 13,
  missed:  10,
  future:  7,
};

const TODAY_SIZE = 22;
const TODAY_RING = 34;

const PRESENT_STATES = new Set<StarState>(['full', 'partial', 'return']);

export default function CosmosCanvas({ dates, stats, today, canvasWidth, onPressStar }: Props) {
  const { cols, cellSize, canvasHeight } = useMemo(
    () => computeLayout(dates.length, canvasWidth),
    [dates.length, canvasWidth],
  );

  const positions = useMemo(
    () => computePositions(dates, cols, cellSize),
    [dates, cols, cellSize],
  );

  const { streakChains, ambientFilaments } = useMemo(() => {
    // Present = days where user actually showed up (not forced-including today)
    const presentSet = new Set(
      dates.filter(d => PRESENT_STATES.has(stats[d]?.state ?? 'future'))
    );
    // Today joins the ambient web if it has any state (draws it into the texture)
    const ambientSet = new Set([
      ...presentSet,
      ...(PRESENT_STATES.has(stats[today]?.state ?? 'future') ? [today] : []),
    ]);
    const streakLengths = computeStreakLengths(dates, presentSet);
    return {
      streakChains:     computeStreakChains(dates, presentSet, streakLengths, positions),
      ambientFilaments: computeAmbientFilaments([...ambientSet], positions),
    };
  }, [dates, positions, stats, today]);

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {/* Ambient web — drawn first so streak chains sit on top */}
        {ambientFilaments.map((l, i) => (
          <Line
            key={`a${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={Colors.textPrimary}
            strokeWidth={l.strokeWidth}
            strokeOpacity={l.opacity}
          />
        ))}
        {/* Streak chains — meaningful layer */}
        {streakChains.map((l, i) => (
          <Line
            key={`s${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={Colors.textPrimary}
            strokeWidth={l.strokeWidth}
            strokeOpacity={l.opacity}
          />
        ))}
      </Svg>

      {dates.map(date => {
        const pos = positions[date];
        if (!pos) return null;
        const isToday = date === today;
        const s = stats[date];
        const state: StarState = s?.state ?? (date <= today ? 'missed' : 'future');
        const starSize = isToday ? TODAY_SIZE : STAR_SIZE[state];
        const isPast = date < today;

        const inner = (
          <>
            {isToday && (
              <View style={{
                position: 'absolute',
                width: TODAY_RING,
                height: TODAY_RING,
                borderRadius: TODAY_RING / 2,
                borderWidth: 1,
                borderColor: Colors.textPrimary,
                opacity: 0.2,
              }} />
            )}
            <StarMark state={state} size={starSize} />
          </>
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
              {inner}
            </TouchableOpacity>
          );
        }

        return (
          <View
            key={date}
            style={{ position: 'absolute', left: pos.x - 22, top: pos.y - 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            {inner}
          </View>
        );
      })}
    </View>
  );
}
