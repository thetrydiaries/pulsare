import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import TimePicker from '@/components/ui/TimePicker';
import { getUser, updateUser } from '@/lib/storage';
import { scheduleAllNotifications } from '@/lib/notifications';
import type { User } from '@/types';
import Constants from 'expo-constants';

const EVENING_OPTIONS = [
  { type: 'reading' as const, label: 'Reading' },
  { type: 'phone-off' as const, label: 'Phone off' },
  { type: 'breathwork' as const, label: 'Breathwork' },
  { type: 'journalling' as const, label: 'Journalling' },
];

export default function ProfileScreen() {
  const [user, setUserState] = useState<User | null>(null);
  const [editingEvening, setEditingEvening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setUserState(getUser());
    }, [])
  );

  if (!user) return null;

  async function saveNotifTimes(key: keyof User['notificationTimes'], value: string) {
    if (!user) return;
    const updated = {
      ...user,
      notificationTimes: { ...user.notificationTimes, [key]: value },
    };
    updateUser({ notificationTimes: updated.notificationTimes });
    setUserState(updated);
    await scheduleAllNotifications(updated);
  }

  async function saveWakeTime(value: string) {
    if (!user) return;
    const updated = { ...user, wakeTime: value };
    updateUser({ wakeTime: value });
    setUserState(updated);
    await scheduleAllNotifications(updated);
  }

  function selectEveningHabit(type: typeof EVENING_OPTIONS[0]['type'], label: string) {
    if (!user) return;
    updateUser({ eveningHabitType: type, eveningHabitLabel: label });
    setUserState({ ...user, eveningHabitType: type, eveningHabitLabel: label });
    setEditingEvening(false);
  }

  const phaseLabel = `phase ${user.currentPhase} · ${
    user.currentPhase === 1 ? 'stabilise' : user.currentPhase === 2 ? 'build' : 'raise the stakes'
  }`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Your anchors */}
        <Section title="your anchors">
          <Row label="wake time">
            <TimePicker
              value={user.wakeTime}
              onChange={saveWakeTime}
              label="wake time"
            />
          </Row>
          <Divider />
          <Row label="evening habit">
            <TouchableOpacity
              onPress={() => setEditingEvening((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="change evening habit"
            >
              <Text variant="bodySemibold" color={Colors.tealText} size={15}>
                {user.eveningHabitLabel}
              </Text>
            </TouchableOpacity>
          </Row>

          {editingEvening && (
            <View style={styles.eveningOptions}>
              {EVENING_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.type}
                  style={[
                    styles.eveningTile,
                    user.eveningHabitType === o.type && styles.eveningTileSelected,
                  ]}
                  onPress={() => selectEveningHabit(o.type, o.label)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: user.eveningHabitType === o.type }}
                >
                  <Text
                    variant="body"
                    color={user.eveningHabitType === o.type ? Colors.tealText : Colors.textSecondary}
                    size={14}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Divider />
          <Row label="morning reminder">
            <TimePicker
              value={user.notificationTimes.morning}
              onChange={(v) => saveNotifTimes('morning', v)}
            />
          </Row>
          <Divider />
          <Row label="movement reminder">
            <TimePicker
              value={user.notificationTimes.movement}
              onChange={(v) => saveNotifTimes('movement', v)}
            />
          </Row>
          <Divider />
          <Row label="wind-down">
            <TimePicker
              value={user.notificationTimes.windDown}
              onChange={(v) => saveNotifTimes('windDown', v)}
            />
          </Row>
        </Section>

        {/* Your reset */}
        <Section title="your reset">
          <Row label="started">
            <Text variant="body" color={Colors.textSecondary} size={14}>
              {user.startDate}
            </Text>
          </Row>
          <Divider />
          <Row label="current phase">
            <Text variant="body" color={Colors.textSecondary} size={14}>
              {phaseLabel}
            </Text>
          </Row>
        </Section>

        {/* Fine print */}
        <Section title="">
          <View style={styles.finePrint}>
            <Text variant="label" style={styles.finePrintText}>
              this app does not collect your data. everything lives on your device.
            </Text>
            <Text variant="micro" style={styles.version}>
              v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      {title ? (
        <Text variant="label" style={sectionStyles.title}>{title}</Text>
      ) : null}
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Text variant="bodyLight" style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16 }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48, gap: 28 },
  eveningOptions: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  eveningTile: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  eveningTileSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  finePrint: { padding: 16, gap: 8 },
  finePrintText: { lineHeight: 18 },
  version: { marginTop: 4 },
});

const sectionStyles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { paddingHorizontal: 4, letterSpacing: 0.8 },
  card: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  label: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
