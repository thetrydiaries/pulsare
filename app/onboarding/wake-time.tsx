import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import TimePicker from '@/components/ui/TimePicker';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

export default function WakeTimeScreen() {
  const [wakeTime, setWakeTime] = useState(() => storage.getString('onboarding.wakeTime') ?? '07:00');

  function handleNext() {
    storage.set('onboarding.wakeTime', wakeTime);
    setOnboardingLastScreen(4);
    router.push('/onboarding/movement');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={12} current={4} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            what time do you want to wake up?
          </Text>

          <View style={styles.pickerBlock}>
            <TimePicker
              value={wakeTime}
              onChange={setWakeTime}
              label="wake time"
            />
          </View>

          <Text variant="label" style={styles.micro}>
            your wake time is the anchor for everything else. your body clock regulates cortisol, mood, and energy — and it needs consistency more than the 'perfect' time. choose what you can protect, not what sounds ideal.
          </Text>
        </View>

        <Button label="next" onPress={handleNext} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 32,
  },
  question: { lineHeight: 36 },
  pickerBlock: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  micro: {
    lineHeight: 20,
    fontSize: 13,
  },
  button: { marginTop: 16 },
});
