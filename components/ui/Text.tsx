import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Variant =
  | 'serif'         // Playfair Display regular
  | 'serifItalic'   // Playfair Display italic
  | 'body'          // Outfit 400
  | 'bodyLight'     // Outfit 300
  | 'bodySemibold'  // Outfit 500
  | 'label'         // Outfit 300 tertiary
  | 'micro';        // Outfit 300 tertiary, smaller

interface Props {
  variant?: Variant;
  color?: string;
  size?: number;
  style?: TextStyle | TextStyle[] | (TextStyle | undefined | null | false)[];
  children: React.ReactNode;
  numberOfLines?: number;
}

export default function Text({
  variant = 'body',
  color,
  size,
  style,
  children,
  numberOfLines,
}: Props) {
  const base = styles[variant];
  const override: TextStyle = {};
  if (color) override.color = color;
  if (size) override.fontSize = size;

  return (
    <RNText
      style={[base, override, style]}
      numberOfLines={numberOfLines}
      allowFontScaling={false}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  serif: {
    fontFamily: 'PlayfairDisplay_400Regular',
    color: Colors.textPrimary,
    fontSize: 16,
  },
  serifItalic: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    color: Colors.textPrimary,
    fontSize: 16,
  },
  body: {
    fontFamily: 'Outfit_400Regular',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  bodyLight: {
    fontFamily: 'Outfit_300Light',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  bodySemibold: {
    fontFamily: 'Outfit_500Medium',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  label: {
    fontFamily: 'Outfit_300Light',
    color: Colors.textTertiary,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  micro: {
    fontFamily: 'Outfit_300Light',
    color: Colors.textTertiary,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
