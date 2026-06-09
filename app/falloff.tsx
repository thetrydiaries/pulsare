import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getLogicalDate } from '@/lib/dayBoundary';
import { updateLogEntry } from '@/lib/storage';
import { recalculateStreak, getConsecutiveMissedDays } from '@/lib/presence';

export default function FalloffScreen() {
  const missedDays = getConsecutiveMissedDays();

  function handleBack() {
    const today = getLogicalDate();
    updateLogEntry(today, { isReturnDay: true });
    recalculateStreak();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="serifItalic" size={72} style={styles.word}>back.</Text>
          <Text variant="label" style={styles.sub}>the door was always open</Text>
          <Text variant="label" color={Colors.textTertiary} style={styles.missedCount}>
            {missedDays === 1 ? 'you were away for 1 day.' : `you were away for ${missedDays} days.`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="I'm back — return to today"
          activeOpacity={0.7}
        >
          <Text variant="bodySemibold" color={Colors.tealText} size={16}>
            I'm back
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  word: {
    lineHeight: 80,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
  },
  missedCount: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.tealAction,
    borderRadius: 26,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
