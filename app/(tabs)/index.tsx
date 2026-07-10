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
import CustomHabitSheet from '@/components/CustomHabitSheet';
import CapstoneCheckInSheet from '@/components/CapstoneCheckInSheet';
import PastDayEditSheet from '@/components/PastDayEditSheet';
import BreathworkGuide from '@/components/BreathworkGuide';
import type { TechniqueKey } from '@/components/BreathworkGuide';
import ProjectTeaseCard from '@/components/ProjectTeaseCard';
import {
  getUser, getLogEntry, updateLogEntry, getPersonalisedCopy,
  getHabits, upsertHabit, setPersonalisedCopy, updateUser,
} from '@/lib/storage';
import { getPendingUnlock, getProjectTease, markBeatShown } from '@/lib/progression';
import { getActiveHabits, addCustomHabit, editCustomHabit, getRevealedHabits, habitRevealDay } from '@/lib/habits';
import { generateCustomHabitLearnContent } from '@/lib/customHabitLearn';
import {
  getLogicalDate, logicalToday, formatDate, timeIsAtOrAfter, currentTime, subtractHours,
} from '@/lib/dayBoundary';
import {
  getRangeStats, recalculateStreak, isFallOff, isMissedOneDayOnly, getPresentDaysCount,
} from '@/lib/presence';
import { getCycleDay, getProgramDay, CYCLE_LENGTH, PROGRAM_LENGTH } from '@/lib/cycle';
import { getStreakData } from '@/lib/storage';
import { scheduleNeverMissTwiceNudge, scheduleCustomHabitNotification, cancelCustomHabitNotification, syncPush } from '@/lib/notifications';
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

const MILESTONE_FALLBACKS: Record<string, string> = {
  day3: 'three days. something has started.',
  day7: 'one week. the anchor is holding.',
  day21: 'three weeks. that\'s neuroplasticity.',
};

function getPersonalisedGreeting(userName: string, startDate: string): string {
  const copy = getPersonalisedCopy();
  const days = daysSinceStart(startDate);

  // Milestone check — days 3, 7, 21
  const milestoneKey =
    days === 3 ? 'day3' : days === 7 ? 'day7' : days === 21 ? 'day21' : null;
  if (milestoneKey) {
    const shownMilestones: string[] = copy?.shownMilestones ?? [];
    if (!shownMilestones.includes(milestoneKey)) {
      const greeting =
        copy?.milestoneGreetings?.[milestoneKey as keyof typeof copy.milestoneGreetings]
        ?? MILESTONE_FALLBACKS[milestoneKey];
      // Mark as shown
      const updatedCopy = { ...(copy ?? { habitExplanations: {}, completionAcknowledgements: {}, greetingVariations: { morning: [], afternoon: [], evening: [], latenight: [] } }), shownMilestones: [...shownMilestones, milestoneKey] };
      setPersonalisedCopy(updatedCopy);
      return greeting;
    }
  }

  // Standard rotation
  const band = getTimeBand();
  const variations = copy?.greetingVariations?.[band] as string[] | undefined;
  if (variations?.length) {
    const idx = (days - 1) % variations.length;
    return variations[idx] ?? `${getGreeting()}, ${userName}.`;
  }
  return `${getGreeting()}, ${userName}.`;
}

function getWeekNumber(startDate: string): number {
  return Math.max(1, Math.ceil(daysSinceStart(startDate) / 7));
}

function getCurrentTechnique(weekNum: number): TechniqueKey {
  if (weekNum <= 1) return 'physiological-sigh';
  if (weekNum <= 2) return 'cyclic-sigh';
  return 'box-breathing';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const today = logicalToday();
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<'morning' | 'evening'>('morning');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [capstoneSheetOpen, setCapstoneSheetOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [guideVisible, setGuideVisible] = useState(false);
  const [guideTechnique, setGuideTechnique] = useState<TechniqueKey>('physiological-sigh');
  const [breathworkHabitId, setBreathworkHabitId] = useState<string | null>(null);
  const [projectTease, setProjectTease] = useState<{ projectName: string | null } | null>(null);
  const [revealBeat, setRevealBeat] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const load = useCallback(() => {
    const user = getUser();
    if (!user) return;

    const currentToday = getLogicalDate();

    const todayEntry = getLogEntry(currentToday);
    if (isFallOff() && !todayEntry?.isReturnDay) {
      router.replace('/falloff');
      return;
    }

    // A phase unlock is due — hand off to the full-screen unlock moment.
    // (If she were mid-lapse the falloff redirect above would have run first,
    // so the unlock naturally waits and fires on her return day instead.)
    const pendingPhase = getPendingUnlock();
    if (pendingPhase) {
      router.replace({ pathname: '/unlock', params: { phase: String(pendingPhase) } });
      return;
    }

    setProjectTease(getProjectTease());

    const currentWeekDates = getWeekDates();

    const dayNum = daysSinceStart(user.startDate);
    const allActive = getActiveHabits();
    // Week-1 gradual reveal: only show habits whose reveal day has arrived.
    const activeHabits = getRevealedHabits(allActive, dayNum);
    setHabits(activeHabits);

    // A phase-1 anchor that becomes visible today gets a gentle "joins your anchors" beat.
    const revealedToday = dayNum > 1 ? allActive.find((h) => habitRevealDay(h) === dayNum) : undefined;
    setRevealBeat(revealedToday ? (revealedToday.userLabel ?? revealedToday.label) : null);

    // Find breathwork habit for guide affordance
    const breathHabit = activeHabits.find((h) => h.suggestedId === 'nervous-system-reset');
    setBreathworkHabitId(breathHabit?.id ?? null);

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
    setIsSunday(logicalToday().getDay() === 0);

    // Determine current breathwork technique
    const weekNum = getWeekNumber(user.startDate);
    setGuideTechnique(getCurrentTechnique(weekNum));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const user = getUser();
    if (user && isMissedOneDayOnly()) {
      scheduleNeverMissTwiceNudge(user);
    }
    // Web: refresh the push subscription's times + lastPresentDay (once per session)
    if (user) {
      syncPush(user).catch(() => {});
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

  function handleNameProject(name: string) {
    updateUser({ projectName: name });
    markBeatShown('projectTease');
    setProjectTease(null);
  }

  function handleDismissTease() {
    markBeatShown('projectTease');
    setProjectTease(null);
  }

  function handleRemoveHabit(habitId: string) {
    const allHabits = getHabits();
    const habit = allHabits[habitId];
    if (!habit) return;
    // Cancel notification if this habit had one
    if (habit.customNotificationTime) {
      cancelCustomHabitNotification().catch(() => {});
    }
    upsertHabit({ ...habit, active: false });
    load();
  }

  function handleOpenEdit(habit: Habit) {
    setEditingHabit(habit);
    setSheetGroup(habit.group);
    setSheetVisible(true);
  }

  async function handleSaveHabit(
    name: string,
    group: 'morning' | 'evening',
    notificationTime: string | null,
    reason: string | null,
  ) {
    const user = getUser();
    if (!user) return;

    if (editingHabit) {
      if (editingHabit.isCustom) {
        const oldNotif = editingHabit.customNotificationTime;
        editCustomHabit(editingHabit.id, name, group, notificationTime, reason);
        if (notificationTime) {
          await scheduleCustomHabitNotification(name, notificationTime);
        } else if (oldNotif) {
          await cancelCustomHabitNotification();
        }
      } else {
        // System habit — only rename via userLabel
        upsertHabit({ ...editingHabit, userLabel: name });
      }
      setEditingHabit(null);
    } else {
      // Add new
      const habit = addCustomHabit(name, group, user.currentPhase, notificationTime, reason);
      if (notificationTime) {
        await scheduleCustomHabitNotification(name, notificationTime);
      }
      generateCustomHabitLearnContent(habit.id, name);
    }
    load();
  }

  function handleOpenAddSheet(group: 'morning' | 'evening') {
    setEditingHabit(null);
    setSheetGroup(group);
    setSheetVisible(true);
  }

  function handleBreathworkComplete() {
    if (breathworkHabitId) {
      handleToggle(breathworkHabitId);
    }
  }

  const user = getUser();
  if (!user) return null;

  const weekDates = getWeekDates();
  const todayIndex = getTodayIndex(weekDates);

  const morning = habits.filter((h) => h.group === 'morning');
  const evening = habits.filter((h) => h.group === 'evening');
  const customMorningCount = habits.filter((h) => h.isCustom && h.group === 'morning').length;
  const customEveningCount = habits.filter((h) => h.isCustom && h.group === 'evening').length;

  const wakeDisplay = formatWakeTime(user.wakeTime);
  const bedtimeDisplay = formatWakeTime(subtractHours(user.wakeTime, 8.5));
  const presentDays = getPresentDaysCount(user.startDate);
  const greeting = getPersonalisedGreeting(user.name, user.startDate);

  const weekNum = getWeekNumber(user.startDate);
  const cycleNumber = user.cycleNumber ?? 1;
  const cycleDay = user.cycleStartDate ? getCycleDay(user.cycleStartDate) : 1;
  const programDay = getProgramDay(user.startDate);

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
            {logicalToday().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase()}
          </Text>
          <View style={styles.statusRight}>
            <View style={styles.phaseLabelBtn}>
              <Text variant="label" color={Colors.tealText}>
                cycle {cycleNumber} · day {cycleDay} of {CYCLE_LENGTH}
              </Text>
              <Text variant="label" color={Colors.textTertiary} style={styles.weekLayerLabel}>
                {programDay <= PROGRAM_LENGTH ? `day ${programDay} of ${PROGRAM_LENGTH}` : 'integration'}
              </Text>
            </View>
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

        {user.capstone && (
          <TouchableOpacity
            style={styles.capstoneStrip}
            onPress={() => setCapstoneSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="log this week's capstone"
          >
            <Text variant="label" color={Colors.textTertiary} style={styles.capstoneLabel}>capstone</Text>
            <Text variant="label" color={Colors.textSecondary} style={styles.capstoneGoal}>{user.capstone.goal}</Text>
          </TouchableOpacity>
        )}

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
          <Text variant="label" style={styles.presenceLabel}>
            days present · 4 of 6 = present
          </Text>
        </View>

        {/* Week strip */}
        {weekStats.length === 7 && (
          <WeekStrip
            days={weekStats}
            todayIndex={todayIndex < 0 ? 6 : todayIndex}
            onDayPress={(date) => setEditDate(date)}
          />
        )}

        {/* Week-3 project tease */}
        {projectTease && (
          <ProjectTeaseCard
            projectName={projectTease.projectName}
            onName={handleNameProject}
            onDismiss={handleDismissTease}
          />
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

        {/* Week-1 reveal beat */}
        {revealBeat && (
          <View style={styles.revealBeat}>
            <Text variant="label" color={Colors.tealText} style={styles.revealBeatText}>
              {revealBeat} joins your anchors today.
            </Text>
            <Text variant="label" color={Colors.textTertiary} style={styles.revealBeatSub}>
              one more, now that the first ones are holding.
            </Text>
          </View>
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
              onEdit={() => handleOpenEdit(h)}
              onGuide={h.id === breathworkHabitId ? () => setGuideVisible(true) : undefined}
            />
          ))}
          {customMorningCount < 2 && (
            <TouchableOpacity
              style={styles.addHabitBtn}
              onPress={() => handleOpenAddSheet('morning')}
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
              onEdit={() => handleOpenEdit(h)}
            />
          ))}
          {customEveningCount < 2 && (
            <TouchableOpacity
              style={styles.addHabitBtn}
              onPress={() => handleOpenAddSheet('evening')}
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

      <CustomHabitSheet
        visible={sheetVisible}
        defaultGroup={sheetGroup}
        editHabit={editingHabit}
        onClose={() => { setSheetVisible(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
      />

      <PastDayEditSheet
        date={editDate}
        onClose={() => { setEditDate(null); load(); }}
      />

      <BreathworkGuide
        visible={guideVisible}
        technique={guideTechnique}
        onDismiss={() => setGuideVisible(false)}
        onComplete={handleBreathworkComplete}
      />

      <CapstoneCheckInSheet
        visible={capstoneSheetOpen}
        onClose={() => setCapstoneSheetOpen(false)}
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
    alignItems: 'flex-end',
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
  weekLayerLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_300Light',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capstoneStrip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginTop: 4,
  },
  capstoneLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  capstoneGoal: {
    fontSize: 13,
  },
  greeting: {
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 36,
  },
  bodyCheck: {
    fontFamily: 'Outfit_300Light',
    fontSize: 16,
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
  revealBeat: {
    marginTop: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.tealAction,
    gap: 3,
  },
  revealBeatText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  revealBeatSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  sleepNote: {
    marginTop: 24,
    lineHeight: 18,
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Outfit_300Light',
  },
});
