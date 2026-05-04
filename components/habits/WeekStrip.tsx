import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import StarMark from '@/components/galaxy/StarMark';
import type { DayStats } from '@/types';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  days: DayStats[]; // exactly 7, Mon→Sun
  todayIndex: number; // 0-based index of today in the week
}

export default function WeekStrip({ days, todayIndex }: Props) {
  return (
    <View style={styles.row}>
      {days.map((day, i) => (
        <View key={day.date} style={styles.cell}>
          <StarMark
            state={day.state}
            size={i === todayIndex ? 22 : 18}
          />
          <Text
            variant="micro"
            color={i === todayIndex ? Colors.tealText : undefined}
          >
            {DAY_LETTERS[i]}
          </Text>
        </View>
      ))}
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
  letter: {
    textAlign: 'center',
  },
});
