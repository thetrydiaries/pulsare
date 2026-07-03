import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import TimePicker from '@/components/ui/TimePicker';
import { storage, setOnboardingLastScreen } from '@/lib/storage';
import { addMinutes } from '@/lib/dayBoundary';

export default function NotificationsScreen() {
  const wakeTime = storage.getString('onboarding.wakeTime') ?? '07:00';
  const [morning, setMorning] = useState(wakeTime);
  const [movement, setMovement] = useState(() => addMinutes(wakeTime, 90));
  const [windDown, setWindDown] = useState('21:30');

  function handleNext() {
    storage.set('onboarding.notif.morning', morning);
    storage.set('onboarding.notif.movement', movement);
    storage.set('onboarding.notif.windDown', windDown);
    setOnboardingLastScreen(9);
    router.push('/onboarding/project');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={13} current={9} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            we'll send you three gentle reminders a day. here are the defaults — change anything.
          </Text>

          <View style={styles.pickers}>
            <View style={styles.pickerRow}>
              <TimePicker value={morning} onChange={setMorning} label="your wake time" />
            </View>
            <View style={styles.divider} />
            <View style={styles.pickerRow}>
              <TimePicker value={movement} onChange={setMovement} label="have you moved yet" />
            </View>
            <View style={styles.divider} />
            <View style={styles.pickerRow}>
              <TimePicker value={windDown} onChange={setWindDown} label="wind down starts now" />
            </View>
          </View>

          <Text variant="label" style={styles.micro}>
            these aren't alarms. they're anchors. consistent timing trains your nervous system more than any single habit.
          </Text>

          {Platform.OS === 'web' && (
            <Text variant="label" color={Colors.textTertiary} style={styles.micro}>
              on iphone, reminders need pulsare installed on your home screen. you'll be asked to allow notifications at the end.
            </Text>
          )}
        </View>

        <Button label="next" onPress={handleNext} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { gap: 28, paddingVertical: 24 },
  question: { lineHeight: 36 },
  pickers: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  pickerRow: { padding: 18, minHeight: 44 },
  divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 18 },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
