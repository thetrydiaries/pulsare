import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import StarMark from '@/components/galaxy/StarMark';
import type { DayStats } from '@/types';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  days: DayStats[]; // exactly 7, Mon→Sun
  todayIndex: number; // 0-based index of today in the week
  onDayPress?: (date: string) => void; // only called for past days (state !== 'future', index < todayIndex)
}

export default function WeekStrip({ days, todayIndex, onDayPress }: Props) {
  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const isPast = i < todayIndex && day.state !== 'future';
        const canTap = isPast && !!onDayPress;
        const inner = (
          <>
            <View style={styles.starContainer}>
              <StarMark state={day.state} isToday={i === todayIndex} />
            </View>
            <Text
              variant="micro"
              color={i === todayIndex ? Colors.tealText : undefined}
            >
              {DAY_LETTERS[i]}
            </Text>
          </>
        );

        if (canTap) {
          return (
            <TouchableOpacity
              key={day.date}
              style={styles.cell}
              onPress={() => onDayPress(day.date)}
              accessibilityRole="button"
              accessibilityLabel={`edit ${day.date}`}
              activeOpacity={0.6}
            >
              {inner}
            </TouchableOpacity>
          );
        }

        return (
          <View key={day.date} style={styles.cell}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  starContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
