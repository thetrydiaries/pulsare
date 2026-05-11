import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';
import { formatDate } from '@/lib/dayBoundary';

export default function StartDateScreen() {
  const [choice, setChoice] = useState<'today' | 'later'>('today');

  // For v1, "pick a date" just advances to tomorrow — full calendar in Build Phase 2
  const today = formatDate(new Date());
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  })();

  function handleNext() {
    const startDate = choice === 'today' ? today : tomorrow;
    storage.set('onboarding.startDate', startDate);
    router.push('/onboarding/intentions');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <PipIndicator total={13} current={11} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            when do you want to begin?
          </Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.tile, choice === 'today' && styles.tileSelected]}
              onPress={() => setChoice('today')}
              accessibilityRole="radio"
              accessibilityState={{ selected: choice === 'today' }}
            >
              <Text
                variant="bodySemibold"
                color={choice === 'today' ? Colors.tealText : Colors.textSecondary}
              >
                today
              </Text>
              <Text variant="label" style={styles.dateLabel}>{today}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tile, choice === 'later' && styles.tileSelected]}
              onPress={() => setChoice('later')}
              accessibilityRole="radio"
              accessibilityState={{ selected: choice === 'later' }}
            >
              <Text
                variant="body"
                color={choice === 'later' ? Colors.tealText : Colors.textSecondary}
              >
                tomorrow
              </Text>
              <Text variant="label" style={styles.dateLabel}>{tomorrow}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button label="next" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: { flex: 1, justifyContent: 'center', gap: 28 },
  question: { lineHeight: 36 },
  options: { gap: 10 },
  tile: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: 44,
    gap: 4,
  },
  tileSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  dateLabel: { fontSize: 11 },
});
