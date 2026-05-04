import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from './Text';

type Variant = 'primary' | 'ghost' | 'outline';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      <Text
        variant="bodySemibold"
        style={[styles.text, variantTextColor[variant], textStyle ?? {}]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const variantTextColor: Record<Variant, TextStyle> = {
  primary: { color: Colors.background },
  ghost: { color: Colors.tealText },
  outline: { color: Colors.tealText },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.tealText,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.tealAction,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
