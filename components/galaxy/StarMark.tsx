import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { StarState } from '@/types';
import { Colors } from '@/constants/colors';

interface Props {
  state: StarState;
  size?: number;      // optional override; defaults to state's canonical size
  isToday?: boolean;  // applies 1.2× multiplier — week strip / home screen only
}

// ─── Asset availability ───────────────────────────────────────────────────────
const STAR_PNGS_READY = true;

const PNG_SOURCES = STAR_PNGS_READY
  ? {
      full:    require('@/assets/stars/star-full.png'),
      partial: require('@/assets/stars/star-partial.png'),
      ghost:   require('@/assets/stars/star-ghost.png'),
      return:  require('@/assets/stars/star-return.png'),
    }
  : null;

// ─── State → render config ────────────────────────────────────────────────────
// Sizes per Amendment 4/8: full=24, partial=18, missed=12, return=26, future=10.
// opacity and tintColor applied at render time.

type AssetKey = 'full' | 'partial' | 'ghost' | 'return';

interface StateConfig {
  assetKey: AssetKey | null;
  opacity: number;
  tint: string | null;
  size: number; // canonical pt size for this state
}

const STATE_CONFIG: Record<StarState, StateConfig> = {
  full:    { assetKey: 'full',    opacity: 0.9,  tint: null,            size: 24 },
  partial: { assetKey: 'partial', opacity: 0.45, tint: null,            size: 18 },
  missed:  { assetKey: 'ghost',   opacity: 0.06, tint: null,            size: 12 },
  return:  { assetKey: 'return',  opacity: 0.9,  tint: Colors.tealText, size: 26 },
  future:  { assetKey: null,      opacity: 0.04, tint: null,            size: 10 },
};

// ─── SVG fallback ─────────────────────────────────────────────────────────────
const STAR_PATH =
  'M50 5 C52 28, 72 28, 95 50 C72 52, 52 72, 50 95 C48 72, 28 52, 5 50 C28 48, 48 28, 50 5 Z';

// ─── Component ────────────────────────────────────────────────────────────────

export default function StarMark({ state, size, isToday = false }: Props) {
  const { assetKey, opacity, tint, size: defaultSize } = STATE_CONFIG[state];
  const baseSize = size ?? defaultSize;
  const actualSize = isToday ? Math.round(baseSize * 1.2) : baseSize;
  // Negative margin keeps the star centred in its cell when larger than base
  const margin = -(actualSize - baseSize) / 2;

  if (STAR_PNGS_READY && PNG_SOURCES && assetKey) {
    const imageStyle: ImageStyle = {
      width: actualSize,
      height: actualSize,
      opacity,
      ...(tint ? { tintColor: tint } : {}),
      ...(margin !== 0 ? { marginHorizontal: margin } : {}),
    };
    return (
      <Image
        source={PNG_SOURCES[assetKey]}
        style={imageStyle}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }

  const fillColor = tint ?? Colors.textPrimary;

  if (state === 'future') {
    return (
      <Svg
        width={actualSize}
        height={actualSize}
        viewBox="0 0 100 100"
        style={{ opacity, marginHorizontal: margin !== 0 ? margin : undefined }}
        accessibilityElementsHidden
      >
        <Path d={STAR_PATH} fill="none" stroke={Colors.textPrimary} strokeWidth={3} />
      </Svg>
    );
  }

  return (
    <Svg
      width={actualSize}
      height={actualSize}
      viewBox="0 0 100 100"
      style={{ opacity, marginHorizontal: margin !== 0 ? margin : undefined }}
      accessibilityElementsHidden
    >
      <Path d={STAR_PATH} fill={fillColor} />
    </Svg>
  );
}
