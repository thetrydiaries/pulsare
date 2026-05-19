import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import TimePicker from '@/components/ui/TimePicker';
import { getUser, updateUser, clearAllData, getHabits, upsertHabit } from '@/lib/storage';
import { scheduleAllNotifications } from '@/lib/notifications';
import { recalculateStreak } from '@/lib/presence';
import { parseDate } from '@/lib/dayBoundary';
import { getDevPhaseOverride, setDevPhaseOverride } from '@/lib/devMode';
import type { User, Habit, Phase } from '@/types';
import Constants from 'expo-constants';

const EVENING_OPTIONS = [
  { type: 'reading' as const, label: 'Reading' },
  { type: 'phone-off' as const, label: 'Phone off' },
  { type: 'breathwork' as const, label: 'Breathwork' },
  { type: 'journalling' as const, label: 'Journalling' },
];

export default function ProfileScreen() {
  const [user, setUserState] = useState<User | null>(null);
  const [customHabits, setCustomHabits] = useState<Habit[]>([]);
  const [editingEvening, setEditingEvening] = useState(false);

  // Dev mode state
  const [devMode, setDevModeState] = useState(false);
  const [showDevToast, setShowDevToast] = useState(false);
  const [devStartDate, setDevStartDate] = useState('');
  const [devPhaseLocal, setDevPhaseLocal] = useState<Phase | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const u = getUser();
      setUserState(u);
      const allHabits = Object.values(getHabits()).filter((h) => h.isCustom && h.active);
      setCustomHabits(allHabits);
      setDevPhaseLocal(getDevPhaseOverride());
    }, [])
  );

  if (!user) return null;

  // ─── Notification / wake time saves ──────────────────────────────────────

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

  // ─── Custom habit removal ─────────────────────────────────────────────────

  function handleRemoveCustomHabit(habitId: string, habitLabel: string) {
    Alert.alert(
      `remove ${habitLabel}?`,
      '',
      [
        { text: 'keep it', style: 'cancel' },
        {
          text: 'yes, remove it',
          onPress: () => {
            const habits = getHabits();
            const habit = habits[habitId];
            if (habit) {
              upsertHabit({ ...habit, active: false });
              setCustomHabits((prev) => prev.filter((h) => h.id !== habitId));
            }
          },
        },
      ]
    );
  }

  // ─── Dev mode ─────────────────────────────────────────────────────────────

  function handleVersionTap() {
    const now = Date.now();
    if (now - lastTapRef.current > 2000) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
      if (tapCountRef.current >= 5) {
        tapCountRef.current = 0;
        activateDevMode();
      }
    }
    lastTapRef.current = now;
  }

  function activateDevMode() {
    setDevModeState(true);
    setShowDevToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowDevToast(false));
  }

  function handleSetStartDate() {
    const trimmed = devStartDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      Alert.alert('invalid date', 'enter a date in YYYY-MM-DD format');
      return;
    }
    if (parseDate(trimmed) > new Date()) {
      Alert.alert('invalid date', 'start date cannot be in the future');
      return;
    }
    updateUser({ startDate: trimmed });
    recalculateStreak();
    setUserState(getUser());
    setDevStartDate('');
    Alert.alert('done', `start date set to ${trimmed}`);
  }

  function handlePhaseOverride(phase: Phase) {
    const next = devPhaseLocal === phase ? null : phase;
    setDevPhaseLocal(next);
    setDevPhaseOverride(next);
  }

  async function confirmReset() {
    await clearAllData();
    router.replace('/onboarding/welcome');
  }

  function handleDevReset() {
    if (Platform.OS === 'web') {
      if (window.confirm('this will delete all data and restart onboarding. are you sure?')) {
        confirmReset();
      }
      return;
    }
    Alert.alert(
      'this will delete all data and restart onboarding. are you sure?',
      '',
      [
        { text: 'cancel', style: 'cancel' },
        { text: 'yes, reset', onPress: confirmReset },
      ]
    );
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
            <TimePicker value={user.wakeTime} onChange={saveWakeTime} label="wake time" />
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

          {/* Custom habits */}
          {customHabits.map((habit) => {
            const label = habit.userLabel ?? habit.label;
            return (
              <View key={habit.id}>
                <Divider />
                <Row label={habit.group}>
                  <View style={styles.customHabitRight}>
                    <Text variant="body" color={Colors.textSecondary} size={14}>{label}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveCustomHabit(habit.id, label)}
                      accessibilityRole="button"
                      accessibilityLabel={`remove ${label}`}
                      style={styles.removeBtn}
                    >
                      <Text variant="label" color={Colors.textTertiary} size={12}>remove</Text>
                    </TouchableOpacity>
                  </View>
                </Row>
              </View>
            );
          })}

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

        {/* Dev tools — only when devMode is active */}
        {devMode && (
          <View style={sectionStyles.wrap}>
            <Text variant="bodySemibold" color={Colors.amber} style={sectionStyles.title}>
              dev tools
            </Text>
            <View style={sectionStyles.card}>

              {/* Set start date */}
              <View style={styles.devRow}>
                <Text variant="bodyLight" style={styles.devLabel}>set start date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={styles.dateInput}
                    value={devStartDate}
                    onChangeText={setDevStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={handleSetStartDate}
                    accessibilityLabel="set start date"
                  />
                  <TouchableOpacity onPress={handleSetStartDate} style={styles.dateSetBtn}>
                    <Text variant="label" color={Colors.amber}>set</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Divider />

              {/* Phase override */}
              <View style={styles.devRow}>
                <Text variant="bodyLight" style={styles.devLabel}>phase override</Text>
                <View style={styles.phaseSegments}>
                  {([1, 2, 3] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.segment, devPhaseLocal === p && styles.segmentSelected]}
                      onPress={() => handlePhaseOverride(p)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: devPhaseLocal === p }}
                    >
                      <Text
                        variant="label"
                        color={devPhaseLocal === p ? Colors.amber : Colors.textTertiary}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Divider />

              {/* Reset everything */}
              <TouchableOpacity
                onPress={handleDevReset}
                style={styles.devResetBtn}
                accessibilityRole="button"
              >
                <Text variant="label" color={Colors.textTertiary}>reset everything</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* Fine print */}
        <Section title="">
          <View style={styles.finePrint}>
            <Text variant="label" style={styles.finePrintText}>
              this app does not collect your data. everything lives on your device.
            </Text>
            <TouchableOpacity
              onPress={handleVersionTap}
              accessibilityRole="none"
              accessibilityLabel=""
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="micro" style={styles.version}>
                v{Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (window.confirm('reset everything? this will delete all your data and restart onboarding.')) {
                    confirmReset();
                  }
                  return;
                }
                Alert.alert(
                  'reset everything?',
                  'this will delete all your data and restart onboarding. cannot be undone.',
                  [
                    { text: 'cancel', style: 'cancel' },
                    { text: 'reset', style: 'destructive', onPress: confirmReset },
                  ]
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="reset all app data"
            >
              <Text variant="micro" color={Colors.textTertiary} style={styles.resetText}>
                reset all data
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

      </ScrollView>

      {/* Dev mode toast */}
      {showDevToast && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="none">
          <View style={styles.toastInner}>
            <Text variant="label" color={Colors.amber}>developer mode on</Text>
          </View>
        </Animated.View>
      )}

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
  customHabitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  removeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  // Dev tools
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  devLabel: { flex: 1 },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    fontFamily: 'Outfit_300Light',
    fontSize: 13,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 4,
    minWidth: 100,
    textAlign: 'right',
  },
  dateSetBtn: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    width: 36,
    height: 32,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    borderColor: Colors.amber,
    backgroundColor: `${Colors.amber}18`,
  },
  devResetBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  // Fine print
  finePrint: { padding: 16, gap: 8 },
  finePrintText: { lineHeight: 18 },
  version: { marginTop: 4 },
  resetBtn: { marginTop: 12, minHeight: 44, justifyContent: 'center' },
  resetText: { textDecorationLine: 'underline' },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastInner: {
    backgroundColor: `${Colors.amber}18`,
    borderWidth: 0.5,
    borderColor: Colors.amber,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
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
