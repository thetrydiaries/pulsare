import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import StarMark from '@/components/galaxy/StarMark';
import { Colors } from '@/constants/colors';
import type { DayStats, StarState } from '@/types';

interface Props {
  dates: string[];
  stats: Record<string, DayStats>;
  today: string;
  canvasWidth: number;
  onPressStar: (date: string) => void;
  // 0–4. Permanent deepening earned at 7/14/21/30 present days — the galaxy
  // keeps gaining depth instead of plateauing. Never decreases.
  milestoneLevel?: number;
}

// Field-glow opacity per milestone level. Stays inside the wide-glow band
// (0.04–0.07) so it reads as depth, never a solid shape.
const FIELD_OPACITY: Record<number, number> = {
  0: 0,
  1: 0.04,
  2: 0.05,
  3: 0.06,
  4: 0.07,
};

const MARGIN = 28;
const SPIRAL_SPACING = 25; // px between spiral rings
const SPIRAL_JITTER = 18;  // ±px organic offset per star
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~137.5° — Vogel sunflower
const CLUSTER_THRESHOLD = 90;
const GLOW_TIERS = 5;

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

// Canvas grows as the galaxy expands — height scales with outermost star radius.
function computeCanvasHeight(n: number): number {
  if (n === 0) return 280;
  const maxR = Math.sqrt(n) * SPIRAL_SPACING + SPIRAL_JITTER + 20;
  return Math.max(280, Math.ceil(maxR * 2) + MARGIN * 3);
}

// Vogel spiral (golden angle sunflower) — each star fans out at ~137.5° from the last,
// so no two consecutive days land near each other. The result looks organic, never grid-like.
// Today sits at the center; history spirals outward so the galaxy grows with every new day.
function computePositions(
  dates: string[],
  canvasWidth: number,
  canvasHeight: number,
): Record<string, { x: number; y: number }> {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const n = dates.length;
  const result: Record<string, { x: number; y: number }> = {};

  dates.forEach((date, i) => {
    // Reverse: today (i = n-1) → spiral index 0 (center); oldest → outer edge
    const si = n - 1 - i;

    let seed = dateToSeed(date);
    const rx = (xorshift(seed) - 0.5) * SPIRAL_JITTER * 2;
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const ry = (xorshift(seed === 0 ? 1 : seed) - 0.5) * SPIRAL_JITTER * 2;

    const angle = si * GOLDEN_ANGLE;
    const radius = Math.sqrt(si + 1) * SPIRAL_SPACING;

    result[date] = {
      x: Math.max(MARGIN, Math.min(canvasWidth - MARGIN, cx + radius * Math.cos(angle) + rx)),
      y: Math.max(MARGIN, Math.min(canvasHeight - MARGIN, cy + radius * Math.sin(angle) + ry)),
    };
  });

  return result;
}

function computeStreakLengths(
  dates: string[],
  presentSet: Set<string>,
): Record<string, number> {
  const lengths: Record<string, number> = {};
  let runStart = -1;
  let runLen = 0;

  const commit = (end: number) => {
    for (let j = runStart; j < end; j++) lengths[dates[j]] = runLen;
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

function streakToT(len: number): number {
  if (len <= 1) return 0;
  if (len <= 2) return 0.2;
  if (len <= 4) return 0.4;
  if (len <= 7) return 0.65;
  return 1.0;
}

interface StarGlow {
  date: string;
  x: number;
  y: number;
  coreTier: number;
  wideTier: number;
  coreRadius: number;
  wideRadius: number;
  isTeal: boolean;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
}

function computeStarGlows(
  dates: string[],
  presentSet: Set<string>,
  stats: Record<string, DayStats>,
  streakLengths: Record<string, number>,
  positions: Record<string, { x: number; y: number }>,
): StarGlow[] {
  const glows: StarGlow[] = [];

  for (const date of dates) {
    if (!presentSet.has(date)) continue;
    const pos = positions[date];
    if (!pos) continue;
    const state = stats[date]?.state ?? 'full';
    const streakLen = streakLengths[date] ?? 1;
    let t = streakToT(streakLen);

    if (state === 'partial') t *= 0.55;

    const tier = Math.round(t * (GLOW_TIERS - 1));
    const coreRadius = 22 + t * 14;
    const wideRadius = 52 + t * 22;

    glows.push({
      date,
      x: pos.x,
      y: pos.y,
      coreTier: tier,
      wideTier: Math.max(0, tier - 1),
      coreRadius,
      wideRadius,
      isTeal: state === 'return',
    });
  }

  return glows;
}

function computeNebulaClouds(
  presentDates: string[],
  positions: Record<string, { x: number; y: number }>,
): NebulaCloud[] {
  if (presentDates.length < 3) return [];

  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (a: string, b: string) => { parent[find(a)] = find(b); };

  for (const d of presentDates) parent[d] = d;

  for (let i = 0; i < presentDates.length; i++) {
    for (let j = i + 1; j < presentDates.length; j++) {
      const a = presentDates[i], b = presentDates[j];
      const pa = positions[a], pb = positions[b];
      if (!pa || !pb) continue;
      const dist = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
      if (dist < CLUSTER_THRESHOLD) union(a, b);
    }
  }

  const groups = new Map<string, string[]>();
  for (const d of presentDates) {
    const root = find(d);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(d);
  }

  const clouds: NebulaCloud[] = [];
  for (const [, members] of groups) {
    if (members.length < 3) continue;
    const cx = members.reduce((s, d) => s + positions[d].x, 0) / members.length;
    const cy = members.reduce((s, d) => s + positions[d].y, 0) / members.length;
    const radius = Math.min(110, 65 + members.length * 4);
    clouds.push({ x: cx, y: cy, radius });
  }

  return clouds;
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

export default function CosmosCanvas({ dates, stats, today, canvasWidth, onPressStar, milestoneLevel = 0 }: Props) {
  const canvasHeight = useMemo(
    () => computeCanvasHeight(dates.length),
    [dates.length],
  );

  const positions = useMemo(
    () => computePositions(dates, canvasWidth, canvasHeight),
    [dates, canvasWidth, canvasHeight],
  );

  const { starGlows, nebulaClouds } = useMemo(() => {
    const presentSet = new Set(
      dates.filter(d => PRESENT_STATES.has(stats[d]?.state ?? 'future'))
    );
    const streakLengths = computeStreakLengths(dates, presentSet);
    return {
      starGlows:    computeStarGlows(dates, presentSet, stats, streakLengths, positions),
      nebulaClouds: computeNebulaClouds([...presentSet], positions),
    };
  }, [dates, positions, stats]);

  const fieldOpacity = FIELD_OPACITY[Math.max(0, Math.min(4, Math.round(milestoneLevel)))] ?? 0;
  const fieldRadius = Math.min(canvasWidth, canvasHeight) * 0.55;

  const tierOpacities = useMemo(() =>
    Array.from({ length: GLOW_TIERS }, (_, tier) => {
      const t = tier / (GLOW_TIERS - 1);
      return {
        core: 0.16 + t * 0.22,
        wide: 0.04 + t * 0.03,
      };
    }),
  []);

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, position: 'relative', overflow: 'hidden' }}>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="field" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={Colors.textPrimary} stopOpacity={fieldOpacity} />
            <Stop offset="55%"  stopColor={Colors.textPrimary} stopOpacity={fieldOpacity * 0.4} />
            <Stop offset="100%" stopColor={Colors.textPrimary} stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="nebula" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={Colors.textPrimary} stopOpacity={0.055} />
            <Stop offset="50%"  stopColor={Colors.textPrimary} stopOpacity={0.022} />
            <Stop offset="100%" stopColor={Colors.textPrimary} stopOpacity={0} />
          </RadialGradient>

          {tierOpacities.map((ops, tier) => (
            <React.Fragment key={`wt${tier}`}>
              <RadialGradient id={`core_w${tier}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={Colors.textPrimary} stopOpacity={ops.core} />
                <Stop offset="45%"  stopColor={Colors.textPrimary} stopOpacity={ops.core * 0.35} />
                <Stop offset="100%" stopColor={Colors.textPrimary} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id={`wide_w${tier}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={Colors.textPrimary} stopOpacity={ops.wide} />
                <Stop offset="65%"  stopColor={Colors.textPrimary} stopOpacity={ops.wide * 0.3} />
                <Stop offset="100%" stopColor={Colors.textPrimary} stopOpacity={0} />
              </RadialGradient>
            </React.Fragment>
          ))}

          {tierOpacities.map((ops, tier) => (
            <React.Fragment key={`tt${tier}`}>
              <RadialGradient id={`core_t${tier}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={Colors.tealText} stopOpacity={ops.core} />
                <Stop offset="45%"  stopColor={Colors.tealText} stopOpacity={ops.core * 0.35} />
                <Stop offset="100%" stopColor={Colors.tealText} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id={`wide_t${tier}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%"   stopColor={Colors.tealText} stopOpacity={ops.wide} />
                <Stop offset="65%"  stopColor={Colors.tealText} stopOpacity={ops.wide * 0.3} />
                <Stop offset="100%" stopColor={Colors.tealText} stopOpacity={0} />
              </RadialGradient>
            </React.Fragment>
          ))}
        </Defs>

        {fieldOpacity > 0 && (
          <Circle cx={canvasWidth / 2} cy={canvasHeight / 2} r={fieldRadius} fill="url(#field)" />
        )}

        {nebulaClouds.map((nc, i) => (
          <Circle key={`nc${i}`} cx={nc.x} cy={nc.y} r={nc.radius} fill="url(#nebula)" />
        ))}

        {starGlows.map(g => (
          <Circle
            key={`w${g.date}`}
            cx={g.x} cy={g.y} r={g.wideRadius}
            fill={`url(#wide_${g.isTeal ? 't' : 'w'}${g.wideTier})`}
          />
        ))}

        {starGlows.map(g => (
          <Circle
            key={`c${g.date}`}
            cx={g.x} cy={g.y} r={g.coreRadius}
            fill={`url(#core_${g.isTeal ? 't' : 'w'}${g.coreTier})`}
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
