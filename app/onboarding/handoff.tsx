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
import { seedHabits, type CustomSeed } from '@/lib/habits';
import { scheduleAllNotifications, requestPermissions } from '@/lib/notifications';
import { formatDate, addMinutes, subtractHours } from '@/lib/dayBoundary';
import { generatePersonalisedCopy } from '@/lib/personalisedCopy';
import type { User, EveningHabitType, Capstone } from '@/types';

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${m.toString().padStart(2, '0')}${ampm}`;
}

function loadSelectedHabits(): string[] {
  const raw = storage.getString('onboarding.selectedHabits');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function loadHabitRenames(): Record<string, string> {
  const raw = storage.getString('onboarding.habitRenames');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function loadCustomHabits(): CustomSeed[] {
  const raw = storage.getString('onboarding.customHabits');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomSeed[]) : [];
  } catch {
    return [];
  }
}

function loadCapstone(): Capstone | undefined {
  const goal = storage.getString('onboarding.capstone.goal');
  if (!goal) return undefined;
  return { goal };
}

export default function HandoffScreen() {
  const name = storage.getString('onboarding.name') ?? 'you';
  const wakeTime = storage.getString('onboarding.wakeTime') ?? '07:00';
  const windDown = storage.getString('onboarding.notif.windDown') ?? '21:30';
  const startDate = storage.getString('onboarding.startDate') ?? formatDate(new Date());
  const bedtime = subtractHours(wakeTime, 8.5);
  const capstone = loadCapstone();
  const selectedHabits = loadSelectedHabits();
  const habitRenames = loadHabitRenames();
  const customHabits = loadCustomHabits();
  const habitCount = selectedHabits.length + customHabits.length;

  async function handleReady() {
    const user: User = {
      name,
      startDate,
      currentPhase: 1, // legacy — always 1 now; presence math still reads it
      wakeTime,
      movementType: storage.getString('onboarding.movement') ?? 'movement',
      breathworkExperience: (storage.getString('onboarding.breathworkExperience') ?? 'no') as 'yes' | 'no',
      breathworkPractice: storage.getString('onboarding.breathworkPractice') ?? null,
      eveningHabitType: (storage.getString('onboarding.eveningHabitType') ?? 'custom') as EveningHabitType,
      eveningHabitLabel: storage.getString('onboarding.eveningHabitLabel') ?? 'wind-down',
      projectName: storage.getString('onboarding.project') ?? null,
      notificationTimes: {
        morning: storage.getString('onboarding.notif.morning') ?? wakeTime,
        movement: storage.getString('onboarding.notif.movement') ?? addMinutes(wakeTime, 90),
        windDown,
      },
      startingMood: storage.getString('onboarding.mood') ?? '',
      capstone,
      cycleStartDate: startDate,
      cycleNumber: 1,
    };

    setUser(user);
    seedHabits(user, selectedHabits, habitRenames, customHabits);

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
        <PipIndicator total={7} current={6} />

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
            {capstone && (
              <SummaryRow label="north star" value={capstone.goal} />
            )}
            <SummaryRow label={`${habitCount} habits picked`} value={`hit 4 = present`} />
            <SummaryRow label="wind-down" value={`from ${formatTime(windDown)}`} />
            <SummaryRow label="cycle 1" value="21 days · review at day 21" />
          </View>

          <Text variant="label" color={Colors.textTertiary} style={styles.anchorNote}>
            you're not meant to hit all of them every day. four is present. the goal isn't perfection — it's showing up more often than not.
          </Text>

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
  anchorNote: { lineHeight: 20, fontSize: 12 },
  bedNote: { lineHeight: 20, fontSize: 12 },
});
