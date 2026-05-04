import React from 'react';
import { Image, ImageStyle, StyleSheet, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import type { StarState } from '@/types';
import { Colors } from '@/constants/colors';

interface Props {
  state: StarState;
  size?: number;
}

// ─── Asset availability ───────────────────────────────────────────────────────
// Set to true once all 12 PNG files are in /assets/stars/.
// React Native picks the correct @1x/@2x/@3x density variant automatically.
// PNG files are white (#ffffff) on transparent — colour and tint applied at render time.
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
// opacity and tintColor are applied at render time regardless of PNG vs SVG mode.
// 'future' is widget-only — no PNG asset, SVG hollow outline only.

type AssetKey = 'full' | 'partial' | 'ghost' | 'return';

interface StateConfig {
  assetKey: AssetKey | null; // null = no PNG (future state)
  opacity: number;
  tint: string | null;       // null = no tint (white pass-through)
  scale: number;
}

const STATE_CONFIG: Record<StarState, StateConfig> = {
  full:    { assetKey: 'full',    opacity: 0.9,  tint: null,              scale: 1   },
  partial: { assetKey: 'partial', opacity: 0.45, tint: null,              scale: 1   },
  missed:  { assetKey: 'ghost',   opacity: 0.06, tint: null,              scale: 1   },
  return:  { assetKey: 'return',  opacity: 0.9,  tint: Colors.tealText,   scale: 1.2 },
  future:  { assetKey: null,      opacity: 0.08, tint: null,              scale: 1   },
};

// ─── SVG fallback ─────────────────────────────────────────────────────────────
// Gestural four-point star path, normalised to a 100×100 viewBox.
const STAR_PATH =
  'M50 5 C52 28, 72 28, 95 50 C72 52, 52 72, 50 95 C48 72, 28 52, 5 50 C28 48, 48 28, 50 5 Z';

// ─── Component ────────────────────────────────────────────────────────────────

export default function StarMark({ state, size = 20 }: Props) {
  const { assetKey, opacity, tint, scale } = STATE_CONFIG[state];
  const actualSize = size * scale;
  const margin = -(actualSize - size) / 2;

  if (STAR_PNGS_READY && PNG_SOURCES && assetKey) {
    // PNG mode — Image with tintColor and opacity applied at render time
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

  // SVG fallback — future state renders as a hollow outline
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
