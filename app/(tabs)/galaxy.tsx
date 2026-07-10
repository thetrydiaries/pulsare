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
import {
  getGalaxyMilestoneLevel,
  getUnshownMilestone,
  markMilestoneShown,
} from '@/lib/progression';
import { getConceptForWeek } from '@/lib/concepts';
import { getCycleDay, CYCLE_LENGTH, isCycleReviewDay } from '@/lib/cycle';
import { getCycleReview, getCapstoneLog, getLatestCapstoneEntry } from '@/lib/storage';
import CycleReviewSheet from '@/components/CycleReviewSheet';
import CapstoneCheckInSheet from '@/components/CapstoneCheckInSheet';
import type { DayStats, Habit, StarState } from '@/types';

type TabView = 'week' | 'month' | 'galaxy' | 'anchors' | 'capstone';

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

function getWeekNumber(startDate: string): number {
  return Math.max(1, Math.ceil(daysSinceStart(startDate) / 7));
}

// One-time milestone acknowledgements — the persistent visual deepening does the
// real work; this is just the quiet note that it happened.
const MILESTONE_COPY: Record<string, { title: string; body: string }> = {
  m7: { title: 'one week present', body: 'seven days in the sky. your galaxy has its first real weight now.' },
  m14: { title: 'two weeks present', body: 'the field around your stars is deepening — you can see the pull now.' },
  m21: { title: 'three weeks present', body: 'past the point most people stop. the wiring is holding on its own.' },
  m30: { title: 'a month present', body: 'thirty days. this isn\'t a streak anymore — it\'s a place you live.' },
};

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
  const [milestoneLevel, setMilestoneLevel] = useState(0);
  const [milestone, setMilestone] = useState<{ key: string; days: number; level: number } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [capstoneSheetOpen, setCapstoneSheetOpen] = useState(false);

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
    const present = getPresentDaysCount(user.startDate);
    setPresentDays(present);
    setMonthDays(getPresentDaysThisMonth(user.startDate));
    setLongestStretch(getLongestStretch(user.startDate));
    setMilestoneLevel(getGalaxyMilestoneLevel(present));
    setMilestone(getUnshownMilestone(present));

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
  const concept = getConceptForWeek(weekNum);
  const cycleNumber = user.cycleNumber ?? 1;
  const cycleDay = user.cycleStartDate ? getCycleDay(user.cycleStartDate) : 1;
  const cycleReviewPending = user.cycleStartDate
    ? isCycleReviewDay(user.cycleStartDate) && !getCycleReview(cycleNumber)
    : false;

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

        {/* Milestone acknowledgement — one-time, dismissible */}
        {milestone && MILESTONE_COPY[milestone.key] && (
          <View style={[styles.milestoneCard, { marginHorizontal: 24 }]}>
            <Text variant="serif" size={18} style={styles.milestoneTitle}>
              {MILESTONE_COPY[milestone.key].title}
            </Text>
            <Text variant="label" color={Colors.textSecondary} style={styles.milestoneBody}>
              {MILESTONE_COPY[milestone.key].body}
            </Text>
            <TouchableOpacity
              onPress={() => { markMilestoneShown(milestone.key); setMilestone(null); }}
              accessibilityRole="button"
              accessibilityLabel="acknowledge milestone"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="label" color={Colors.tealText} style={styles.milestoneAck}>
                keep going →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats row — above tabs for permanent visibility */}
        <View style={[styles.statsRow, { paddingHorizontal: canvasPaddingH }]}>
          <StatBlock value={`${cycleDay} / ${CYCLE_LENGTH}`} label={`cycle ${cycleNumber}`} />
          <StatBlock value={presentDays} label="days present" />
          <StatBlock value={longestStretch} label="longest stretch" />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }]}>
          {((user.capstone
            ? ['week', 'month', 'galaxy', 'anchors', 'capstone']
            : ['week', 'month', 'galaxy', 'anchors']) as TabView[]).map((t) => (
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
              milestoneLevel={milestoneLevel}
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

        {/* Capstone tab */}
        {tab === 'capstone' && user.capstone && (
          <View style={{ paddingHorizontal: canvasPaddingH, paddingTop: 8 }}>
            <CapstonePane
              onLog={() => setCapstoneSheetOpen(true)}
            />
          </View>
        )}

        {/* Day 21 — cycle review beat */}
        {cycleReviewPending && tab !== 'anchors' && tab !== 'capstone' && (
          <TouchableOpacity
            style={[styles.reviewCard, { marginHorizontal: canvasPaddingH }]}
            onPress={() => setReviewOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="open cycle review"
          >
            <Text variant="serif" size={18} style={styles.conceptTitle}>
              cycle {cycleNumber} — 21 days done
            </Text>
            <Text variant="label" color={Colors.textSecondary} style={styles.conceptDef}>
              stop tracking for a beat. notice what stuck. that's the real signal.
            </Text>
            <Text variant="label" color={Colors.tealText} style={styles.readMore}>
              open review →
            </Text>
          </TouchableOpacity>
        )}

        {/* Weekly concept card */}
        {tab !== 'anchors' && tab !== 'capstone' && !cycleReviewPending && (
          <View style={[styles.conceptCard, { marginHorizontal: canvasPaddingH }]}>
            <Text variant="serif" size={18} style={styles.conceptTitle}>{concept.title}</Text>
            <Text variant="label" color={Colors.textSecondary} style={styles.conceptDef}>
              {concept.definition}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/learn',
                  params: { concept: concept.key },
                })
              }
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

      <CycleReviewSheet
        visible={reviewOpen}
        cycleNumber={cycleNumber}
        onClose={() => { setReviewOpen(false); loadStats(); }}
      />

      <CapstoneCheckInSheet
        visible={capstoneSheetOpen}
        onClose={() => setCapstoneSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function CapstonePane({ onLog }: { onLog: () => void }) {
  const user = getUser();
  if (!user?.capstone) return null;
  const log = getCapstoneLog();
  const latest = getLatestCapstoneEntry();
  const { goal, startValue, targetValue, unit = '' } = user.capstone;
  const latestVal = latest?.value;
  const delta = latestVal !== undefined && startValue !== undefined ? latestVal - startValue : null;
  const remaining =
    latestVal !== undefined && targetValue !== undefined ? latestVal - targetValue : null;

  return (
    <View style={styles.capstonePane}>
      <View style={styles.capstoneHeader}>
        <Text variant="label" color={Colors.textTertiary} style={styles.capstoneLabelStrip}>capstone</Text>
        <Text variant="serif" size={22} style={styles.capstoneGoalLine}>{goal}</Text>
      </View>

      <View style={styles.capstoneRow}>
        {startValue !== undefined && (
          <View style={styles.capstoneStat}>
            <Text variant="serif" size={22}>{startValue}{unit}</Text>
            <Text variant="label" style={styles.statLabel}>start</Text>
          </View>
        )}
        <View style={styles.capstoneStat}>
          <Text variant="serif" size={22} color={Colors.tealText}>
            {latestVal !== undefined ? `${latestVal}${unit}` : '—'}
          </Text>
          <Text variant="label" style={styles.statLabel}>latest</Text>
        </View>
        {targetValue !== undefined && (
          <View style={styles.capstoneStat}>
            <Text variant="serif" size={22}>{targetValue}{unit}</Text>
            <Text variant="label" style={styles.statLabel}>target</Text>
          </View>
        )}
      </View>

      {delta !== null && (
        <Text variant="label" color={Colors.textSecondary} style={styles.capstoneDelta}>
          {delta === 0
            ? 'holding at day 1 weight'
            : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit} from day 1`}
          {remaining !== null && ` · ${Math.abs(remaining).toFixed(1)}${unit} to target`}
        </Text>
      )}

      <TouchableOpacity
        style={styles.capstoneLogBtn}
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel="log this week's capstone"
      >
        <Text variant="label" color={Colors.tealText}>+ log this week</Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />

      {log.length === 0 ? (
        <Text variant="label" color={Colors.textTertiary} style={styles.capstoneEmpty}>
          no entries yet. sunday mornings are the ritual.
        </Text>
      ) : (
        <View>
          <Text variant="label" style={styles.capstoneLabelStrip}>history</Text>
          {[...log].reverse().map((entry) => (
            <View key={entry.date} style={styles.capstoneEntry}>
              <Text variant="label" style={styles.capstoneEntryDate}>{entry.date}</Text>
              <Text variant="body" size={15} color={Colors.textSecondary}>
                {entry.value !== undefined ? `${entry.value}${unit}` : '—'}
              </Text>
              {entry.note ? (
                <Text variant="label" color={Colors.textTertiary} style={styles.capstoneEntryNote}>
                  {entry.note}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
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
  capstonePane: { gap: 14 },
  capstoneHeader: { gap: 4 },
  capstoneLabelStrip: { letterSpacing: 0.6, fontSize: 11 },
  capstoneGoalLine: { lineHeight: 28 },
  capstoneRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  capstoneStat: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  capstoneDelta: { fontSize: 13, lineHeight: 20 },
  capstoneLogBtn: {
    borderWidth: 0.5,
    borderColor: Colors.tealAction,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  capstoneEmpty: { fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  capstoneEntry: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  capstoneEntryDate: { fontSize: 11, color: Colors.textTertiary, letterSpacing: 0.4 },
  capstoneEntryNote: { fontSize: 12, lineHeight: 18, marginTop: 2 },

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

  // Milestone card
  milestoneCard: {
    marginTop: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: Colors.tealAction,
    borderRadius: 14,
    backgroundColor: `${Colors.tealAction}10`,
    gap: 8,
  },
  milestoneTitle: { lineHeight: 24 },
  milestoneBody: { lineHeight: 20 },
  milestoneAck: { marginTop: 2 },

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
  reviewCard: {
    marginTop: 32,
    backgroundColor: `${Colors.tealAction}18`,
    borderWidth: 1,
    borderColor: Colors.tealAction,
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
