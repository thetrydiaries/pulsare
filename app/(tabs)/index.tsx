import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import HabitRow from '@/components/habits/HabitRow';
import WeekStrip from '@/components/habits/WeekStrip';
import PhaseExplainerModal from '@/components/PhaseExplainerModal';
import CustomHabitSheet from '@/components/CustomHabitSheet';
import { getUser, getLogEntry, updateLogEntry, getPersonalisedCopy, getHabits, upsertHabit } from '@/lib/storage';
import { getActiveHabits, addCustomHabit } from '@/lib/habits';
import { generateCustomHabitLearnContent } from '@/lib/customHabitLearn';
import {
  getLogicalDate,
  formatDate,
  timeIsAtOrAfter,
  currentTime,
  subtractHours,
} from '@/lib/dayBoundary';
import {
  getRangeStats,
  recalculateStreak,
  isFallOff,
  isMissedOneDayOnly,
  getPresentDaysCount,
} from '@/lib/presence';
import { getStreakData } from '@/lib/storage';
import {
  scheduleNeverMissTwiceNudge,
} from '@/lib/notifications';
import { daysSinceStart } from '@/lib/dayBoundary';
import { getDevPhaseOverride } from '@/lib/devMode';
import type { Habit, DayStats, Phase } from '@/types';

// ─── Greeting helpers ─────────────────────────────────────────────────────────

type TimeBand = 'morning' | 'afternoon' | 'evening' | 'latenight';

function getTimeBand(): TimeBand {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'latenight';
}

function getGreeting(): string {
  const band = getTimeBand();
  if (band === 'morning') return 'good morning';
  if (band === 'afternoon') return 'good afternoon';
  if (band === 'evening') return 'good evening';
  return 'still up';
}

function getPersonalisedGreeting(userName: string, startDate: string): string {
  const copy = getPersonalisedCopy();
  const band = getTimeBand();
  const variations = copy?.greetingVariations?.[band] as string[] | undefined;
  if (variations?.length) {
    const idx = (daysSinceStart(startDate) - 1) % variations.length;
    return variations[idx] ?? `${getGreeting()}, ${userName}.`;
  }
  return `${getGreeting()}, ${userName}.`;
}

// ─── Phase helpers ────────────────────────────────────────────────────────────

function phaseNameFor(phase: number): string {
  if (phase === 1) return 'stabilise';
  if (phase === 2) return 'build';
  return 'raise the stakes';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDate(d);
  });
}

function getTodayIndex(weekDates: string[]): number {
  const today = getLogicalDate();
  return weekDates.indexOf(today);
}

function formatWakeTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${m.toString().padStart(2, '0')}${ampm}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [bodyWord, setBodyWord] = useState('');
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [isEveningTime, setIsEveningTime] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [isSunday, setIsSunday] = useState(false);
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<'morning' | 'evening'>('morning');
  const appState = useRef(AppState.currentState);

  const load = useCallback(() => {
    const user = getUser();
    if (!user) return;

    if (isFallOff()) {
      router.replace('/falloff');
      return;
    }

    // Recompute date values inside the callback so there's no stale closure.
    const currentToday = getLogicalDate();
    const currentWeekDates = getWeekDates();

    const effectivePhase = (getDevPhaseOverride() ?? user.currentPhase) as Phase;
    const activeHabits = getActiveHabits(effectivePhase);
    setHabits(activeHabits);

    const entry = getLogEntry(currentToday);
    setCompleted(entry?.habits ?? {});
    setBodyWord(entry?.bodyCheckWord ?? '');

    const stats = getRangeStats(currentWeekDates);
    setWeekStats(stats);

    recalculateStreak();
    setStreakCount(getStreakData().currentStreak);

    const windDown = user.notificationTimes.windDown;
    setIsEveningTime(timeIsAtOrAfter(currentTime(), windDown));

    setShowNudge(isMissedOneDayOnly());
    setIsSunday(new Date().getDay() === 0);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Schedule never-miss-twice nudge once per session, not on every load() call.
  useEffect(() => {
    const user = getUser();
    if (user && isMissedOneDayOnly()) {
      scheduleNeverMissTwiceNudge(user);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        load();
      }
      appState.current = next;
    });
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [load]);

  function handleToggle(id: string) {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    const t = getLogicalDate();
    updateLogEntry(t, { habits: next });
    recalculateStreak();
    setStreakCount(getStreakData().currentStreak);
    setWeekStats(getRangeStats(getWeekDates()));
  }

  function handleBodyWord(text: string) {
    setBodyWord(text);
    updateLogEntry(getLogicalDate(), { bodyCheckWord: text || null });
  }

  function handleRemoveHabit(habitId: string) {
    const allHabits = getHabits();
    const habit = allHabits[habitId];
    if (!habit) return;
    upsertHabit({ ...habit, active: false });
    load();
  }

  function handleAddHabit(name: string, group: 'morning' | 'evening') {
    const user = getUser();
    if (!user) return;
    const habit = addCustomHabit(name, group, user.currentPhase);
    generateCustomHabitLearnContent(habit.id, name);
    load();
  }

  const user = getUser();
  if (!user) return null;

  const weekDates = getWeekDates();
  const todayIndex = getTodayIndex(weekDates);

  const effectivePhase = (getDevPhaseOverride() ?? user.currentPhase) as Phase;
  const morning = habits.filter((h) => h.group === 'morning');
  const evening = habits.filter((h) => h.group === 'evening');
  const customMorningCount = habits.filter((h) => h.isCustom && h.group === 'morning').length;
  const customEveningCount = habits.filter((h) => h.isCustom && h.group === 'evening').length;

  const wakeDisplay = formatWakeTime(user.wakeTime);
  const bedtimeDisplay = formatWakeTime(subtractHours(user.wakeTime, 8.5));
  const presentDays = getPresentDaysCount(user.startDate);
  const greeting = getPersonalisedGreeting(user.name, user.startDate);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status bar row */}
        <View style={styles.statusRow}>
          <Text variant="label">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase()}
          </Text>
          <View style={styles.statusRight}>
            <TouchableOpacity
              onPress={() => setPhaseModalVisible(true)}
              style={styles.phaseLabelBtn}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              accessibilityRole="button"
              accessibilityLabel="tap to see all phases"
            >
              <Text variant="label" color={Colors.tealText}>
                {`phase ${effectivePhase} · ${phaseNameFor(effectivePhase)}`}
              </Text>
              <View style={styles.phaseDot} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.settingsBtn}
              accessibilityRole="button"
              accessibilityLabel="settings"
            >
              <Text variant="label" color={Colors.textTertiary} size={18}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <Text variant="serif" size={26} style={styles.greeting}>
          {greeting}
        </Text>

        {/* Body check */}
        <TextInput
          style={styles.bodyCheck}
          placeholder="one word — how does your body feel?"
          placeholderTextColor={Colors.textTertiary}
          value={bodyWord}
          onChangeText={(t) => handleBodyWord(t.toLowerCase())}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit
          accessibilityLabel="body check — optional"
        />

        {/* Presence block */}
        <View style={styles.presenceBlock}>
          <Text variant="serif" size={40}>{presentDays}</Text>
          <Text variant="label" style={styles.presenceLabel}>days present</Text>
        </View>

        {/* Week strip */}
        {weekStats.length === 7 && (
          <WeekStrip days={weekStats} todayIndex={todayIndex < 0 ? 6 : todayIndex} />
        )}

        {/* Sunday reflection prompt */}
        {isSunday && (
          <TouchableOpacity
            style={styles.reflectionBanner}
            onPress={() => router.push('/reflection')}
            accessibilityRole="button"
            accessibilityLabel="weekly reflection — tap to open"
          >
            <Text variant="body" color={Colors.tealText} size={14}>weekly reflection</Text>
            <Text variant="label" style={styles.reflectionSub}>sundays are for looking back →</Text>
          </TouchableOpacity>
        )}

        {/* Morning habits */}
        <View style={styles.group}>
          <Text variant="label" style={styles.groupLabel}>morning</Text>
          {morning.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              completed={!!completed[h.id]}
              nudge={showNudge}
              onToggle={handleToggle}
              onRemove={h.isCustom ? () => handleRemoveHabit(h.id) : undefined}
            />
          ))}
          {customMorningCount < 2 && (
            <TouchableOpacity
              style={styles.addHabitBtn}
              onPress={() => { setSheetGroup('morning'); setSheetVisible(true); }}
              accessibilityRole="button"
              accessibilityLabel="add a habit to morning group"
            >
              <Text variant="label" color={Colors.textTertiary} size={18}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Evening habits */}
        <View style={[styles.group, !isEveningTime && styles.groupDimmed]}>
          <Text variant="label" style={styles.groupLabel}>evening</Text>
          {evening.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              completed={!!completed[h.id]}
              onToggle={handleToggle}
              onRemove={h.isCustom ? () => handleRemoveHabit(h.id) : undefined}
            />
          ))}
          {customEveningCount < 2 && (
            <TouchableOpacity
              style={styles.addHabitBtn}
              onPress={() => { setSheetGroup('evening'); setSheetVisible(true); }}
              accessibilityRole="button"
              accessibilityLabel="add a habit to evening group"
            >
              <Text variant="label" color={Colors.textTertiary} size={18}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sleep note */}
        <Text variant="label" style={styles.sleepNote}>
          to keep your {wakeDisplay} anchor, aim to be in bed by {bedtimeDisplay}. sleep is where the repair happens.
        </Text>
      </ScrollView>

      <PhaseExplainerModal
        visible={phaseModalVisible}
        onClose={() => setPhaseModalVisible(false)}
        currentPhase={effectivePhase}
        habits={habits}
      />

      <CustomHabitSheet
        visible={sheetVisible}
        defaultGroup={sheetGroup}
        onClose={() => setSheetVisible(false)}
        onAdd={handleAddHabit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phaseLabelBtn: {
    alignItems: 'center',
    gap: 3,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  phaseDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  settingsBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 36,
  },
  bodyCheck: {
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    color: Colors.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  presenceBlock: {
    marginTop: 16,
    marginBottom: 4,
    gap: 2,
  },
  presenceLabel: {
    letterSpacing: 0.8,
  },
  group: {
    marginTop: 20,
  },
  groupDimmed: {
    opacity: 0.3,
  },
  groupLabel: {
    marginBottom: 8,
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
  addHabitBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  reflectionBanner: {
    marginTop: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.tealAction,
    borderRadius: 12,
    backgroundColor: `${Colors.tealAction}10`,
    gap: 4,
  },
  reflectionSub: {
    fontSize: 11,
  },
  sleepNote: {
    marginTop: 24,
    lineHeight: 18,
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Outfit_300Light',
  },
});
