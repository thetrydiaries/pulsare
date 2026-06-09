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
const MIN_CELL = 56;   // minimum cell size — drives how many columns fit
const MAX_COLS = 8;    // caps flat wide-screen layouts to keep the web preview representative
const FILAMENT_THRESHOLD = 120;
const FILAMENT_MAX_OPACITY = 0.32;
const MAX_FILAMENTS = 150;

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
  // Square cells — cellSize drives BOTH width and height so jitter is isotropic
  const cellSize = usableW / cols;
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
  x1: number; y1: number; x2: number; y2: number; opacity: number;
}

// Spatial bucketing: O(n) average — only checks 3×3 cell neighbourhood per star
function computeFilaments(
  presentDates: string[],
  positions: Record<string, { x: number; y: number }>,
): FilamentLine[] {
  const buckets = new Map<string, string[]>();

  for (const date of presentDates) {
    const pos = positions[date];
    if (!pos) continue;
    const bx = Math.floor(pos.x / FILAMENT_THRESHOLD);
    const by = Math.floor(pos.y / FILAMENT_THRESHOLD);
    const key = `${bx},${by}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(date);
  }

  const lines: FilamentLine[] = [];

  for (const date of presentDates) {
    const pos = positions[date];
    if (!pos) continue;
    const bx = Math.floor(pos.x / FILAMENT_THRESHOLD);
    const by = Math.floor(pos.y / FILAMENT_THRESHOLD);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighbors = buckets.get(`${bx + dx},${by + dy}`);
        if (!neighbors) continue;
        for (const neighbor of neighbors) {
          // ISO string ordering deduplicates pairs without a Set
          if (neighbor <= date) continue;
          const npos = positions[neighbor];
          if (!npos) continue;
          const dist = Math.sqrt((pos.x - npos.x) ** 2 + (pos.y - npos.y) ** 2);
          if (dist < FILAMENT_THRESHOLD) {
            lines.push({
              x1: pos.x, y1: pos.y, x2: npos.x, y2: npos.y,
              opacity: (1 - dist / FILAMENT_THRESHOLD) * FILAMENT_MAX_OPACITY,
            });
          }
        }
      }
    }
  }

  if (lines.length <= MAX_FILAMENTS) return lines;
  // Keep strongest connections (closest pairs have highest opacity)
  return lines.sort((a, b) => b.opacity - a.opacity).slice(0, MAX_FILAMENTS);
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

  const filaments = useMemo(() => {
    const presentDates = dates.filter(d => {
      const state = stats[d]?.state ?? 'future';
      return PRESENT_STATES.has(state) || d === today;
    });
    return computeFilaments(presentDates, positions);
  }, [dates, positions, stats, today]);

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {filaments.map((l, i) => (
          <Line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={Colors.textPrimary}
            strokeWidth={1}
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
