import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import StarMark from '@/components/galaxy/StarMark';
import { getUser } from '@/lib/storage';
import {
  dateRangeFromStart,
  getLogicalDate,
  formatDate,
  parseDate,
} from '@/lib/dayBoundary';
import {
  getDayStats,
  getPresentDaysCount,
  getPresenceRate,
} from '@/lib/presence';
import { getStreakData } from '@/lib/storage';
import type { DayStats } from '@/types';

type TabView = 'week' | 'month';

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

// Pad month to start on Monday
function getMonthGrid(): (string | null)[] {
  const dates = getMonthDates();
  const firstDow = (parseDate(dates[0]).getDay() + 6) % 7; // Mon=0
  const padding: null[] = Array(firstDow).fill(null);
  return [...padding, ...dates];
}

// Small deterministic x/y nudge per date — makes the field read as organic
function deterministicOffset(dateString: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * 31 + dateString.charCodeAt(i)) & 0xffffffff;
  }
  const x = ((hash & 0xff) / 255 - 0.5) * 6; // ±3pt
  const y = (((hash >> 8) & 0xff) / 255 - 0.5) * 6; // ±3pt
  return { x, y };
}

export default function GalaxyScreen() {
  const [tab, setTab] = useState<TabView>('week');
  const [stats, setStats] = useState<Record<string, DayStats>>({});
  const [presentDays, setPresentDays] = useState(0);
  const [presenceRate, setPresenceRate] = useState(0);
  const [streak, setStreak] = useState(0);

  const insets = useSafeAreaInsets();
  // Canvas horizontal padding: device safe area + 20pt per spec
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
      // Add future days for month view
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
  const monthGrid = getMonthGrid();
  const today = getLogicalDate();

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

        {/* Tabs — same horizontal inset as canvas */}
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

        {/* Week view — canvas with safe area insets */}
        {tab === 'week' && (
          <View style={[styles.weekRow, { paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }]}>
            {weekDates.map((d) => {
              const s = stats[d] ?? { date: d, state: d <= today ? 'missed' : 'future', habitsComplete: 0, habitsTotal: 0 };
              const offset = deterministicOffset(d);
              return (
                <View
                  key={d}
                  style={[styles.weekCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                >
                  <StarMark state={s.state} />
                  <Text variant="micro" style={styles.dayLabel}>
                    {parseDate(d).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Month view — canvas with safe area insets */}
        {tab === 'month' && (
          <View style={{ paddingLeft: canvasPaddingH, paddingRight: insets.right + 20 }}>
            <View style={styles.dayHeaders}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                <View key={i} style={styles.gridCell}>
                  <Text variant="micro" style={styles.dayHeaderLabel}>{l}</Text>
                </View>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {monthGrid.map((d, i) => {
                if (!d) return <View key={`pad-${i}`} style={styles.gridCell} />;
                const s = stats[d] ?? { date: d, state: d <= today ? 'missed' : 'future', habitsComplete: 0, habitsTotal: 0 };
                const offset = deterministicOffset(d);
                return (
                  <View
                    key={d}
                    style={[styles.gridCell, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}
                  >
                    <StarMark state={s.state} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBlock value={presentDays} label="days present" />
          <StatBlock value={`${presenceRate}%`} label="presence rate" />
          <StatBlock value={streak} label="current streak" />
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
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  weekCell: { alignItems: 'center', gap: 6, flex: 1 },
  dayLabel: { textAlign: 'center' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeaderLabel: { textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
