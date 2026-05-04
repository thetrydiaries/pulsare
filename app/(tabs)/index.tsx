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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import HabitRow from '@/components/habits/HabitRow';
import WeekStrip from '@/components/habits/WeekStrip';
import { getUser, getLogEntry, updateLogEntry } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import {
  getLogicalDate,
  formatDate,
  parseDate,
  timeIsAtOrAfter,
  currentTime,
} from '@/lib/dayBoundary';
import {
  getDayStats,
  getRangeStats,
  recalculateStreak,
  isFallOff,
  isMissedOneDayOnly,
  getPresentDaysCount,
} from '@/lib/presence';
import { getStreakData } from '@/lib/storage';
import {
  scheduleNeverMissTwiceNudge,
  scheduleFallOffNotification,
} from '@/lib/notifications';
import type { Habit, DayStats } from '@/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  return 'good evening';
}

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

export default function HomeScreen() {
  const user = getUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [bodyWord, setBodyWord] = useState('');
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [isEveningTime, setIsEveningTime] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [isSunday, setIsSunday] = useState(false);
  const appState = useRef(AppState.currentState);

  const today = getLogicalDate();
  const weekDates = getWeekDates();
  const todayIndex = getTodayIndex(weekDates);

  const load = useCallback(() => {
    if (!user) return;

    // Fall-off check — redirect if needed
    if (isFallOff()) {
      router.replace('/falloff');
      return;
    }

    const activeHabits = getActiveHabits(user.currentPhase);
    setHabits(activeHabits);

    const entry = getLogEntry(today);
    setCompleted(entry?.habits ?? {});
    setBodyWord(entry?.bodyCheckWord ?? '');

    const stats = getRangeStats(weekDates);
    setWeekStats(stats);

    recalculateStreak();
    setStreakCount(getStreakData().currentStreak);

    // Time-aware evening opacity
    const windDown = user.notificationTimes.windDown;
    setIsEveningTime(timeIsAtOrAfter(currentTime(), windDown));

    // Never-miss-twice nudge
    setShowNudge(isMissedOneDayOnly());

    // Sunday reflection prompt
    setIsSunday(new Date().getDay() === 0);

    // Schedule nudge/falloff notifications based on state
    if (isMissedOneDayOnly()) {
      scheduleNeverMissTwiceNudge(user);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh on foreground and every 5 minutes
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

    const entry = getLogEntry(today) ?? {
      habits: {},
      bodyCheckWord: null,
      isReturnDay: false,
      dayBoundaryApplied: false,
    };
    updateLogEntry(today, { habits: next });
    recalculateStreak();
    setStreakCount(getStreakData().currentStreak);

    // Update week strip
    const stats = getRangeStats(weekDates);
    setWeekStats(stats);
  }

  function handleBodyWord(text: string) {
    setBodyWord(text);
    updateLogEntry(today, { bodyCheckWord: text || null });
  }

  if (!user) return null;

  const morning = habits.filter((h) => h.group === 'morning');
  const evening = habits.filter((h) => h.group === 'evening');

  const bedtime = (() => {
    const [wh, wm] = user.wakeTime.split(':').map(Number);
    const totalMin = wh * 60 + wm - 8.5 * 60;
    const bh = Math.floor(((totalMin % (24 * 60)) + 24 * 60) % (24 * 60) / 60);
    const bm = Math.floor(totalMin % 60);
    const ampm = bh >= 12 ? 'pm' : 'am';
    const dh = bh % 12 === 0 ? 12 : bh % 12;
    return `${dh}:${bm.toString().padStart(2, '0')}${ampm}`;
  })();

  const presentDays = getPresentDaysCount(user.startDate);
  const wakeDisplay = (() => {
    const [h, m] = user.wakeTime.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${m.toString().padStart(2, '0')}${ampm}`;
  })();

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
          <Text variant="label" color={Colors.tealText}>phase 1 · stabilise</Text>
        </View>

        {/* Greeting */}
        <Text variant="serif" size={26} style={styles.greeting}>
          {getGreeting()},{' '}
          <Text variant="serifItalic" size={26}>{user.name}</Text>.
        </Text>

        {/* Body check */}
        <TextInput
          style={styles.bodyCheck}
          placeholder="one word — how does your body feel?"
          placeholderTextColor={Colors.textTertiary}
          value={bodyWord}
          onChangeText={handleBodyWord}
          returnKeyType="done"
          blurOnSubmit
          accessibilityLabel="body check — optional"
        />

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
            />
          ))}
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
            />
          ))}
        </View>

        {/* Sleep note */}
        <Text variant="label" style={styles.sleepNote}>
          to protect your {wakeDisplay}, aim to be in bed by {bedtime}. sleep is where the repair happens.
        </Text>

        {/* Streak */}
        <View style={styles.streakBlock}>
          <Text variant="serif" size={40}>{streakCount}</Text>
          <Text variant="label" style={styles.streakLabel}>days present</Text>
        </View>
      </ScrollView>
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
  group: {
    marginTop: 16,
  },
  groupDimmed: {
    opacity: 0.3,
  },
  groupLabel: {
    marginBottom: 4,
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
  sleepNote: {
    marginTop: 20,
    lineHeight: 18,
    fontSize: 12,
  },
  streakBlock: {
    marginTop: 32,
    alignItems: 'flex-start',
    gap: 2,
  },
  streakLabel: {
    letterSpacing: 0.8,
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
});
