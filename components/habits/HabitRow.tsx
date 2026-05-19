import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getPersonalisedCopy } from '@/lib/storage';
import type { Habit } from '@/types';

const COMPLETION_FALLBACKS: Record<string, string> = {
  'wake-anchor': 'the anchor holds.',
  'water-before-coffee': 'before the caffeine. good.',
  'morning-movement': 'signal sent.',
  'nervous-system-reset': "two minutes. that's all is needed.",
  'evening-anchor': 'you ended the day with intention.',
};

interface Props {
  habit: Habit;
  completed: boolean;
  nudge?: boolean;
  onToggle: (id: string) => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onGuide?: () => void; // only provided for breathwork habit
}

export default function HabitRow({ habit, completed, nudge = false, onToggle, onRemove, onEdit, onGuide }: Props) {
  const fillAnim = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ackAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const prevCompleted = useRef(completed);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Sync fill animation when `completed` is changed externally.
  useEffect(() => {
    if (prevCompleted.current !== completed) {
      prevCompleted.current = completed;
      fillAnim.setValue(completed ? 1 : 0);
    }
  }, [completed, fillAnim]);

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

  function handleLongPress() {
    if (habit.isCustom && (onEdit || onRemove)) setShowActions(true);
  }

  function handleEditTap() {
    setShowActions(false);
    onEdit?.();
  }

  function handleRemoveTap() {
    setShowActions(false);
    Alert.alert(
      `remove ${displayLabel}?`,
      '',
      [
        { text: 'keep it', style: 'cancel' },
        { text: 'yes, remove it', onPress: onRemove },
      ]
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
      ackAnim.stopAnimation();
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
      <TouchableOpacity
        style={styles.labelBlock}
        onLongPress={habit.isCustom && (onEdit || onRemove) ? handleLongPress : undefined}
        delayLongPress={500}
        activeOpacity={habit.isCustom && (onEdit || onRemove) ? 0.7 : 1}
        accessible={false}
      >
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
        {showActions && (
          <View style={styles.actionsRow}>
            {onEdit && (
              <TouchableOpacity onPress={handleEditTap} accessibilityRole="button" accessibilityLabel={`edit ${displayLabel}`}>
                <Text variant="label" color={Colors.tealText} style={styles.actionText}>
                  edit
                </Text>
              </TouchableOpacity>
            )}
            {onRemove && (
              <TouchableOpacity onPress={handleRemoveTap} accessibilityRole="button" accessibilityLabel={`remove ${displayLabel}`}>
                <Text variant="label" color={Colors.textTertiary} style={styles.actionText}>
                  remove this habit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <Animated.Text
          style={[styles.ackText, { opacity: ackAnim }]}
          accessibilityElementsHidden
        >
          {getAckText()}
        </Animated.Text>
      </TouchableOpacity>

      {/* Guide affordance — breathwork only */}
      {onGuide && (
        <TouchableOpacity
          onPress={onGuide}
          style={styles.guideTarget}
          accessibilityRole="button"
          accessibilityLabel="open breathwork guide"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="label" color={Colors.textTertiary} style={styles.guideLabel}>
            guide
          </Text>
        </TouchableOpacity>
      )}

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
  actionsRow: {
    gap: 2,
    marginTop: 2,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 20,
  },
  ackText: {
    fontFamily: 'Outfit_300Light',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  guideTarget: {
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    opacity: 0.5,
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
