import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useAnimatedValue,
  AccessibilityInfo,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getPersonalisedCopy } from '@/lib/storage';
import type { Habit } from '@/types';

const COMPLETION_FALLBACKS: Record<string, string> = {
  'wake-anchor': 'the anchor holds.',
  'water-before-coffee': 'before the caffeine. good.',
  'morning-movement': 'signal sent.',
  'nervous-system-reset': "two minutes. that's all it needed.",
  'evening-anchor': 'you ended the day with intention.',
};

interface Props {
  habit: Habit;
  completed: boolean;
  nudge?: boolean;
  onToggle: (id: string) => void;
}

export default function HabitRow({ habit, completed, nudge = false, onToggle }: Props) {
  const fillAnim = useAnimatedValue(completed ? 1 : 0);
  const scaleAnim = useAnimatedValue(1);
  const ackAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const displayLabel = habit.userLabel ?? habit.label;

  function getAckText(): string {
    const suggestedId = habit.suggestedId ?? '';
    const copy = getPersonalisedCopy();
    return (
      copy?.completionAcknowledgements?.[suggestedId] ??
      COMPLETION_FALLBACKS[suggestedId] ??
      'done.'
    );
  }

  const handlePress = useCallback(() => {
    const toValue = completed ? 0 : 1;

    Animated.timing(fillAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();

    if (!reduceMotion && !completed) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 120, useNativeDriver: false }),
      ]).start();
    }

    if (!completed) {
      ackAnim.setValue(0);
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(ackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(ackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }

    onToggle(habit.id);
  }, [completed, habit.id, onToggle, fillAnim, scaleAnim, ackAnim, reduceMotion]);

  const circleBackground = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', Colors.tealAction],
  });

  const circleBorder = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.tealAction],
  });

  return (
    <View
      style={[styles.row, nudge && styles.nudge]}
      accessibilityRole="none"
    >
      <View style={styles.labelBlock}>
        <View style={styles.labelRow}>
          <Text
            variant="body"
            color={completed ? Colors.tealText : Colors.textPrimary}
            style={styles.label}
          >
            {displayLabel}
          </Text>
          <View style={styles.learnDot} />
        </View>
        <Animated.Text
          style={[styles.ackText, { opacity: ackAnim }]}
          accessibilityElementsHidden
        >
          {getAckText()}
        </Animated.Text>
      </View>

      <TouchableOpacity
        onPress={handlePress}
        style={styles.checkTarget}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${displayLabel}, ${completed ? 'complete' : 'not complete'}`}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: circleBackground,
              borderColor: circleBorder,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {completed && (
            <Text variant="micro" color={Colors.background} size={12}>
              ✓
            </Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nudge: {
    backgroundColor: `${Colors.amber}14`,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  labelBlock: {
    flex: 1,
    paddingRight: 16,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 15,
  },
  learnDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  ackText: {
    fontFamily: 'Outfit_300Light',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checkTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
