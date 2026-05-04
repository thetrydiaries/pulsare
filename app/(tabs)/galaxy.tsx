import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import StarMark from '@/components/galaxy/StarMark';
import { getUser } from '@/lib/storage';
import {
  dateRangeFromStart,
  getLogicalDate,
  formatDate,
  parseDate,
  daysSinceStart,
} from '@/lib/dayBoundary';
import {
  getDayStats,
  getPresentDaysCount,
  getPresenceRate,
} from '@/lib/presence';
import { getStreakData } from '@/lib/storage';
import type { DayStats } from '@/types';

type TabView = 'week' | 'month';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Galaxy concept cards (weeks 1–3) ────────────────────────────────────────

interface GalaxyConcept {
  title: string;
  definition: string;
}

const GALAXY_CONCEPTS: GalaxyConcept[] = [
  {
    title: 'circadian rhythm',
    definition: 'your body runs on a 24-hour internal clock that governs cortisol, mood, energy, and sleep — and consistency matters more than the time you choose.',
  },
  {
    title: 'the cortisol awakening response',
    definition: 'in the 30–45 minutes after waking, cortisol spikes naturally to prepare you for the day — what you do in that window either amplifies the spike or steadies it.',
  },
  {
    title: 'neuroplasticity',
    definition: 'every time you repeat a behaviour, the neural pathway for it becomes slightly more efficient — what you\'ve been doing for three weeks is literally restructuring your brain.',
  },
];

function getWeekNumber(startDate: string): number {
  return Math.max(1, Math.ceil(daysSinceStart(startDate) / 7));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDate(d);
  });
}

function getMonthDates(): string[] {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dates: string[] = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Returns month dates padded to start on Monday, grouped into rows of 7.
// Using explicit rows (not flexWrap) avoids float-precision misalignment.
function getMonthWeeks(): (string | null)[][] {
  const dates = getMonthDates();
  // (getDay() + 6) % 7: Sun=6, Mon=0, ..., Sat=5
  const firstDow = (parseDate(dates[0]).getDay() + 6) % 7;
  const padded: (string | null)[] = [
    ...Array(firstDow).fill(null),
    ...dates,
  ];
  // Fill trailing cells to complete last row
  while (padded.length % 7 !== 0) padded.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

function deterministicOffset(dateString: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * 31 + dateString.charCodeAt(i)) & 0xffffffff;
  }
  const x = ((hash & 0xff) / 255 - 0.5) * 6;
  const y = (((hash >> 8) & 0xff) / 255 - 0.5) * 6;
  return { x, y };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GalaxyScreen() {
  const [tab, setTab] = useState<TabView>('week');
  const [stats, setStats] = useState<Record<string, DayStats>>({});
  const [presentDays, setPresentDays] = useState(0);
  const [presenceRate, setPresenceRate] = useState(0);
  const [streak, setStreak] = useState(0);

  const insets = useSafeAreaInsets();
  const canvasPaddingH = insets.left + 20;

  const user = getUser();

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const dates = dateRangeFromStart(user.startDate);
      const map: Record<string, DayStats> = {};
      for (const d of dates) {
        map[d] = getDayStats(d);
      }
      const monthDates = getMonthDates();
      for (const d of monthDates) {
        if (!map[d]) map[d] = { date: d, state: 'future', habitsComplete: 0, habitsTotal: 0 };
      }
      setStats(map);
      setPresentDays(getPresentDaysCount(user.startDate));
      setPresenceRate(getPresenceRate(user.startDate));
      setStreak(getStreakData().currentStreak);
    }, [user?.startDate])
  );

  if (!user) return null;

  const weekDates = getWeekDates();
  const monthWeeks = getMonthWeeks();
  const today = getLogicalDate();

  const weekNum = getWeekNumber(user.startDate);
  const conceptIndex = Math.min(weekNum - 1, GALAXY_CONCEPTS.length - 1);
  const concept = GALAXY_CONCEPTS[conceptIndex];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.textSection}>
          <View style={styles.header}>
            <Text variant="serif" size={32}>your</Text>
            <Text variant="serifItalic" size={32}>galaxy</Text>
          </View>
          <Text variant="label" style={styles.subtitle}>every star is a day you showed up</Text>
          <Text variant="micro" style={styles.cosmic}>
            the cosmic web and a neural network look identical under a microscope. you're building both.
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }]}>
          {(['week', 'month'] as TabView[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tab}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
            >
              <Text
                variant="label"
                color={tab === t ? Colors.tealText : Colors.textTertiary}
                style={tab === t ? styles.tabActive : undefined}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Week view */}
        {tab === 'week' && (
          <View style={[styles.weekRow, { paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }]}>
            {weekDates.map((d, i) => {
              const s = stats[d] ?? { date: d, state: d <= today ? 'missed' : 'future', habitsComplete: 0, habitsTotal: 0 };
              const offset = deterministicOffset(d);
              const isToday = d === today;
              const labelColor = isToday ? Colors.textSecondary : Colors.textTertiary;
              return (
                <View
                  key={d}
                  style={[styles.weekCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                >
                  <Text variant="micro" style={[styles.weekDayLetter, { color: labelColor }]}>
                    {DAY_LETTERS[i]}
                  </Text>
                  <View style={styles.weekStarContainer}>
                    <StarMark state={s.state} />
                  </View>
                  <Text variant="micro" style={[styles.weekDateNum, { color: labelColor }]}>
                    {parseDate(d).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Month view — explicit rows to avoid float-precision column misalignment */}
        {tab === 'month' && (
          <View style={{ paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }}>
            <View style={styles.dayHeaderRow}>
              {DAY_LETTERS.map((l, i) => (
                <View key={i} style={styles.gridCell}>
                  <Text variant="micro" style={styles.dayHeaderLabel}>{l}</Text>
                </View>
              ))}
            </View>
            {monthWeeks.map((week, wi) => (
              <View key={wi} style={styles.monthWeekRow}>
                {week.map((d, ci) => {
                  if (!d) return <View key={`pad-${wi}-${ci}`} style={styles.gridCell} />;
                  const s = stats[d] ?? { date: d, state: d <= today ? 'missed' : 'future', habitsComplete: 0, habitsTotal: 0 };
                  const offset = deterministicOffset(d);
                  return (
                    <View
                      key={d}
                      style={[styles.gridCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                    >
                      <View style={styles.monthStarContainer}>
                        <StarMark state={s.state} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBlock value={presentDays} label="days present" />
          <StatBlock value={`${presenceRate}%`} label="presence rate" />
          <StatBlock value={streak} label="current streak" />
        </View>

        {/* Weekly concept card */}
        <View style={[styles.conceptCard, { marginHorizontal: canvasPaddingH }]}>
          <Text variant="serif" size={18} style={styles.conceptTitle}>{concept.title}</Text>
          <Text variant="label" color={Colors.textSecondary} style={styles.conceptDef}>
            {concept.definition}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/learn')}
            accessibilityRole="link"
            accessibilityLabel="read more on learn screen"
          >
            <Text variant="label" color={Colors.tealText} style={styles.readMore}>
              read more →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text variant="serif" size={28}>{value}</Text>
      <Text variant="label" style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 20, paddingBottom: 48, gap: 8 },
  textSection: { paddingHorizontal: 24 },
  header: { gap: 0 },
  subtitle: { marginTop: 8 },
  cosmic: { lineHeight: 18, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  tab: { minHeight: 44, justifyContent: 'center' },
  tabActive: { borderBottomWidth: 1, borderBottomColor: Colors.tealText },

  // Week view
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekDayLetter: {
    textAlign: 'center',
  },
  weekStarContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateNum: {
    textAlign: 'center',
  },

  // Month view
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderLabel: {
    textAlign: 'center',
  },
  monthWeekRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthStarContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  statBlock: { alignItems: 'flex-start', gap: 2, flex: 1 },
  statLabel: { fontSize: 10 },

  // Concept card
  conceptCard: {
    marginTop: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  conceptTitle: {
    lineHeight: 26,
  },
  conceptDef: {
    lineHeight: 20,
  },
  readMore: {
    textAlign: 'right',
    marginTop: 4,
  },
});
