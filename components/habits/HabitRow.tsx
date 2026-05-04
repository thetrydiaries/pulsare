import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useAnimatedValue,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import type { Habit } from '@/types';

interface Props {
  habit: Habit;
  completed: boolean;
  nudge?: boolean; // amber highlight for never-miss-twice
  onToggle: (id: string) => void;
}

export default function HabitRow({ habit, completed, nudge = false, onToggle }: Props) {
  const fillAnim = useAnimatedValue(completed ? 1 : 0);

  const handlePress = useCallback(() => {
    const toValue = completed ? 0 : 1;
    Animated.timing(fillAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    onToggle(habit.id);
  }, [completed, habit.id, onToggle, fillAnim]);

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
      style={[
        styles.row,
        nudge && styles.nudge,
      ]}
      accessibilityRole="none"
    >
      <View style={styles.labelBlock}>
        <Text
          variant="body"
          color={completed ? Colors.tealText : Colors.textPrimary}
          style={styles.label}
        >
          {habit.label}
        </Text>
        {habit.microExplanation ? (
          <Text variant="label" style={styles.micro}>
            {habit.microExplanation}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handlePress}
        style={styles.checkTarget}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${habit.label}, ${completed ? 'complete' : 'not complete'}`}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: circleBackground,
              borderColor: circleBorder,
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
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  nudge: {
    backgroundColor: `${Colors.amber}14`, // ~8% opacity
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  labelBlock: {
    flex: 1,
    paddingRight: 16,
    gap: 3,
  },
  label: {
    fontSize: 15,
  },
  micro: {
    lineHeight: 16,
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
