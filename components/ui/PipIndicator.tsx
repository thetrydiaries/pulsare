import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  total: number;
  current: number; // 0-indexed current screen
}

export default function PipIndicator({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i <= current ? styles.filled : styles.empty,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  pip: {
    height: 2,
    width: 20,
    borderRadius: 1,
  },
  filled: {
    backgroundColor: Colors.tealText,
  },
  empty: {
    backgroundColor: Colors.border,
  },
});
