import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';
import { setUser, setOnboardingComplete } from '@/lib/storage';
import { initPhase1Habits } from '@/lib/habits';
import { scheduleAllNotifications, requestPermissions } from '@/lib/notifications';
import { formatDate, addMinutes, subtractHours } from '@/lib/dayBoundary';
import { generatePersonalisedCopy } from '@/lib/personalisedCopy';
import type { User, EveningHabitType } from '@/types';

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${m.toString().padStart(2, '0')}${ampm}`;
}

export default function HandoffScreen() {
  const name = storage.getString('onboarding.name') ?? 'you';
  const wakeTime = storage.getString('onboarding.wakeTime') ?? '07:00';
  const movement = storage.getString('onboarding.movement') ?? 'morning movement';
  const eveningLabel = storage.getString('onboarding.eveningHabitLabel') ?? 'evening habit';
  const windDown = storage.getString('onboarding.notif.windDown') ?? '21:30';
  const startDate = storage.getString('onboarding.startDate') ?? formatDate(new Date());
  const bedtime = subtractHours(wakeTime, 8.5);

  async function handleReady() {
    const user: User = {
      name,
      startDate,
      currentPhase: 1,
      phaseUnlockState: 'active',
      wakeTime,
      movementType: movement,
      breathworkExperience: (storage.getString('onboarding.breathworkExperience') ?? 'no') as 'yes' | 'no',
      breathworkPractice: storage.getString('onboarding.breathworkPractice') ?? null,
      eveningHabitType: (storage.getString('onboarding.eveningHabitType') ?? 'custom') as EveningHabitType,
      eveningHabitLabel: eveningLabel,
      projectName: storage.getString('onboarding.project') ?? null,
      notificationTimes: {
        morning: storage.getString('onboarding.notif.morning') ?? wakeTime,
        movement: storage.getString('onboarding.notif.movement') ?? addMinutes(wakeTime, 90),
        windDown,
      },
      startingMood: storage.getString('onboarding.mood') ?? '',
    };

    setUser(user);
    initPhase1Habits(user);
    setOnboardingComplete();

    const granted = await requestPermissions();
    if (granted) {
      await scheduleAllNotifications(user);
    }

    router.replace('/(tabs)');

    // generate personalised copy silently in background after navigation
    generatePersonalisedCopy();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={12} current={11} />

        <View style={styles.content}>
          <Text variant="serif" size={28} style={styles.headline}>
            that's everything,{' '}
            <Text variant="serifItalic" size={28}>{name}</Text>.
          </Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.sub}>
            your reset starts now.
          </Text>

          <View style={styles.summary}>
            <SummaryRow label="wake at" value={formatTime(wakeTime)} />
            <SummaryRow label={movement} value="before midday" />
            <SummaryRow label="2 minutes of breathing" value="any time" />
            <SummaryRow label="water before coffee" value="every morning" />
            <SummaryRow label={eveningLabel} value={`from ${formatTime(windDown)}`} />
          </View>

          <Text variant="label" style={styles.bedNote}>
            to keep your {formatTime(wakeTime)} anchor, aim to be in bed by {formatTime(bedtime)}. sleep is where the repair happens.
          </Text>
        </View>

        <Button label="i'm ready" onPress={handleReady} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="body" style={styles.rowLabel}>{label}</Text>
      <Text variant="label" color={Colors.tealText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { flex: 1, gap: 28, paddingVertical: 24 },
  headline: { lineHeight: 40 },
  sub: { marginTop: -16 },
  summary: {
    gap: 0,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  rowLabel: { flex: 1, fontSize: 14 },
  bedNote: { lineHeight: 20, fontSize: 12 },
});
