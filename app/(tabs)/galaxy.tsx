import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import StarMark from '@/components/galaxy/StarMark';
import CosmosCanvas from '@/components/galaxy/CosmosCanvas';
import PastDayEditSheet from '@/components/PastDayEditSheet';
import { getUser, getAllLogDates, getLogEntry } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import {
  getLogicalDate,
  logicalToday,
  formatDate,
  parseDate,
  daysSinceStart,
} from '@/lib/dayBoundary';
import {
  getDayStats,
  getPresentDaysCount,
  getPresentDaysThisMonth,
  getLongestStretch,
  getEffectiveDates,
} from '@/lib/presence';
import type { DayStats, Habit, StarState } from '@/types';

type TabView = 'week' | 'month' | 'galaxy' | 'anchors';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Protocol habit display order (by suggestedId)
const PROTOCOL_ORDER = [
  'wake-anchor',
  'morning-light',
  'water-before-coffee',
  'morning-movement',
  'nervous-system-reset',
  'evening-anchor',
];

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
  const today = logicalToday();
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
  const today = logicalToday();
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

function getMonthWeeks(): (string | null)[][] {
  const dates = getMonthDates();
  const firstDow = (parseDate(dates[0]).getDay() + 6) % 7;
  const padded: (string | null)[] = [...Array(firstDow).fill(null), ...dates];
  while (padded.length % 7 !== 0) padded.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
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

// ─── Anchors tab helpers ──────────────────────────────────────────────────────

function sortHabitsForAnchors(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => {
    const ai = a.suggestedId ? PROTOCOL_ORDER.indexOf(a.suggestedId) : Infinity;
    const bi = b.suggestedId ? PROTOCOL_ORDER.indexOf(b.suggestedId) : Infinity;
    if (ai === bi) return 0;
    return ai - bi;
  });
}

function computeLifetimeCounts(habits: Habit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const h of habits) counts[h.id] = 0;
  const dates = getAllLogDates();
  for (const date of dates) {
    const entry = getLogEntry(date);
    if (!entry?.habits) continue;
    for (const h of habits) {
      if (entry.habits[h.id] === true) counts[h.id] = (counts[h.id] ?? 0) + 1;
    }
  }
  return counts;
}

function getSparklineStates(habit: Habit, weekDates: string[], today: string): StarState[] {
  return weekDates.map((date) => {
    if (date > today) return 'future';
    const entry = getLogEntry(date);
    return entry?.habits?.[habit.id] === true ? 'full' : 'missed';
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GalaxyScreen() {
  const [tab, setTab] = useState<TabView>('week');
  const [stats, setStats] = useState<Record<string, DayStats>>({});
  const [presentDays, setPresentDays] = useState(0);
  const [monthDays, setMonthDays] = useState(0);
  const [longestStretch, setLongestStretch] = useState(0);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [anchorHabits, setAnchorHabits] = useState<Habit[]>([]);
  const [lifetimeCounts, setLifetimeCounts] = useState<Record<string, number>>({});

  const insets = useSafeAreaInsets();
  const canvasPaddingH = insets.left + 20;

  const user = getUser();

  const loadStats = useCallback(() => {
    if (!user) return;
    // getEffectiveDates unions dateRangeFromStart with all stored log dates,
    // so days logged before the official startDate (e.g. via developer mode)
    // are included in both the stats map and the galaxy canvas.
    const effectiveDates = getEffectiveDates(user.startDate);
    const allDates = [...new Set([...effectiveDates, ...getWeekDates(), ...getMonthDates()])];
    const map: Record<string, DayStats> = {};
    for (const d of allDates) {
      map[d] = getDayStats(d);
    }
    setStats(map);
    setPresentDays(getPresentDaysCount(user.startDate));
    setMonthDays(getPresentDaysThisMonth(user.startDate));
    setLongestStretch(getLongestStretch(user.startDate));

    const habits = sortHabitsForAnchors(getActiveHabits(user.currentPhase));
    setAnchorHabits(habits);
    setLifetimeCounts(computeLifetimeCounts(habits));
  }, [user?.startDate, user?.currentPhase]);

  useFocusEffect(loadStats);

  if (!user) return null;

  const { width: screenWidth } = useWindowDimensions();
  const weekDates = getWeekDates();
  const monthWeeks = getMonthWeeks();
  const allDates = getEffectiveDates(user.startDate);
  const canvasWidth = screenWidth - canvasPaddingH * 2;
  const today = getLogicalDate();

  const weekNum = getWeekNumber(user.startDate);
  const conceptIndex = Math.min(weekNum - 1, GALAXY_CONCEPTS.length - 1);
  const concept = GALAXY_CONCEPTS[conceptIndex];

  const totalCompletions = Object.values(lifetimeCounts).reduce((s, n) => s + n, 0);

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

        {/* Stats row — above tabs for permanent visibility */}
        <View style={[styles.statsRow, { paddingHorizontal: canvasPaddingH }]}>
          <StatBlock value={presentDays} label="days present" />
          <StatBlock value={monthDays} label="this month" />
          <StatBlock value={longestStretch} label="longest stretch" />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }]}>
          {(['week', 'month', 'galaxy', 'anchors'] as TabView[]).map((t) => (
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
              const isPast = d < today && d >= user.startDate;
              const labelColor = isToday ? Colors.textSecondary : Colors.textTertiary;
              const cellContent = (
                <>
                  <Text variant="micro" style={[styles.weekDayLetter, { color: labelColor }]}>
                    {DAY_LETTERS[i]}
                  </Text>
                  <View style={styles.weekStarContainer}>
                    <StarMark state={s.state} />
                  </View>
                  <Text variant="micro" style={[styles.weekDateNum, { color: labelColor }]}>
                    {parseDate(d).getDate()}
                  </Text>
                </>
              );
              if (isPast) {
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.weekCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                    onPress={() => setEditDate(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`edit ${d}`}
                    activeOpacity={0.6}
                  >
                    {cellContent}
                  </TouchableOpacity>
                );
              }
              return (
                <View
                  key={d}
                  style={[styles.weekCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                >
                  {cellContent}
                </View>
              );
            })}
          </View>
        )}

        {/* Month grid */}
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
                  const isPast = d < today && d >= user.startDate;
                  const starContent = (
                    <View style={styles.monthStarContainer}>
                      <StarMark state={s.state} />
                    </View>
                  );
                  if (isPast) {
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.gridCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                        onPress={() => setEditDate(d)}
                        accessibilityRole="button"
                        accessibilityLabel={`edit ${d}`}
                        activeOpacity={0.6}
                      >
                        {starContent}
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View
                      key={d}
                      style={[styles.gridCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                    >
                      {starContent}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Galaxy — all-time cosmic web */}
        {tab === 'galaxy' && (
          <View style={{ paddingLeft: canvasPaddingH, paddingRight: canvasPaddingH }}>
            <CosmosCanvas
              dates={allDates}
              stats={stats}
              today={today}
              canvasWidth={canvasWidth}
              onPressStar={(date) => setEditDate(date)}
            />
          </View>
        )}

        {/* Anchors tab */}
        {tab === 'anchors' && (
          <View style={{ paddingHorizontal: canvasPaddingH, paddingTop: 8 }}>
            {totalCompletions === 0 ? (
              <Text
                variant="label"
                color={Colors.textTertiary}
                style={styles.emptyAnchors}
              >
                your first completion will appear here.
              </Text>
            ) : (
              anchorHabits.map((habit, index) => {
                const count = lifetimeCounts[habit.id] ?? 0;
                const label = habit.userLabel ?? habit.label;
                const sparkStates = getSparklineStates(habit, weekDates, today);
                return (
                  <View key={habit.id}>
                    {index > 0 && <View style={styles.anchorDivider} />}
                    <View style={styles.anchorRow}>
                      {/* Left: star + label + sparkline */}
                      <View style={styles.anchorLeft}>
                        <View style={styles.anchorLabelRow}>
                          <View style={styles.anchorStarContainer}>
                            <StarMark state="full" size={20} />
                          </View>
                          <Text
                            variant="body"
                            color={Colors.textSecondary}
                            style={styles.anchorLabel}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </View>
                        {/* 7-day sparkline */}
                        <View style={styles.sparkline}>
                          {/* Day letters */}
                          <View style={styles.sparkLetterRow}>
                            {DAY_LETTERS.map((l, i) => (
                              <View key={i} style={styles.sparkCell}>
                                <Text style={styles.sparkLetter}>{l}</Text>
                              </View>
                            ))}
                          </View>
                          {/* Stars */}
                          <View style={styles.sparkStarRow}>
                            {weekDates.map((d, i) => {
                              const isToday = d === today;
                              const sparkSize = isToday ? 14 : 12;
                              return (
                                <View key={d} style={styles.sparkCell}>
                                  <StarMark state={sparkStates[i]} size={sparkSize} />
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>

                      {/* Right: count */}
                      <View style={styles.anchorRight}>
                        <Text
                          variant="serif"
                          size={28}
                          color={Colors.textPrimary}
                          style={styles.anchorCount}
                        >
                          {count}
                        </Text>
                        <Text style={styles.anchorTimes}>times</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Weekly concept card */}
        {tab !== 'anchors' && (
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
        )}
      </ScrollView>

      <PastDayEditSheet
        date={editDate}
        onClose={() => { setEditDate(null); loadStats(); }}
      />
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

  // Stats row — now above tabs
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  statBlock: { alignItems: 'flex-start', gap: 2, flex: 1 },
  statLabel: { fontSize: 10 },

  tabs: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
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

  // Month grid
  dayHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  dayHeaderLabel: { textAlign: 'center' },
  monthWeekRow: { flexDirection: 'row' },
  gridCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  monthStarContainer: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  // Anchors tab
  emptyAnchors: {
    textAlign: 'center',
    marginTop: 48,
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 12,
  },
  anchorLeft: {
    flex: 1,
    gap: 10,
  },
  anchorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  anchorStarContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorLabel: {
    flex: 1,
    fontSize: 15,
  },
  anchorRight: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 56,
  },
  anchorCount: {
    textAlign: 'right',
  },
  anchorTimes: {
    fontFamily: 'Outfit_300Light',
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  anchorDivider: {
    height: 0.5,
    backgroundColor: '#1c1c1c',
  },

  // Sparkline
  sparkline: {
    gap: 3,
    marginLeft: 30, // align with label (star 20 + gap 10)
  },
  sparkLetterRow: {
    flexDirection: 'row',
  },
  sparkStarRow: {
    flexDirection: 'row',
  },
  sparkCell: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkLetter: {
    fontFamily: 'Outfit_300Light',
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

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
