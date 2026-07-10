import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';
import type { DayPhase } from '@/types';

interface HabitOption {
  id: string;
  label: string;
  dayPhase: DayPhase;
  suggested: boolean;
  why: string; // one-liner rationale — surfaced on the tile
}

// Phase 1 · 0–8h post-wake (activation window)
// Ordered by biological leverage. The first four are Huberman's protocol foundation.
const PHASE_1_OPTIONS: HabitOption[] = [
  {
    id: 'wake-anchor',
    label: 'wake time consistency',
    dayPhase: 'phase1',
    suggested: true,
    why: 'sets your master body clock. every other habit rides this one.',
  },
  {
    id: 'morning-light',
    label: 'morning light (10 min)',
    dayPhase: 'phase1',
    suggested: true,
    why: 'highest-leverage habit in the stack. sets cortisol and sleep 14h later.',
  },
  {
    id: 'water-before-coffee',
    label: 'delay caffeine 90 min',
    dayPhase: 'phase1',
    suggested: true,
    why: 'protects natural cortisol peak. prevents afternoon crash + tolerance.',
  },
  {
    id: 'morning-movement',
    label: 'movement (20–30 min)',
    dayPhase: 'phase1',
    suggested: true,
    why: 'BDNF, dopamine, activation. outdoors doubles as morning-light.',
  },
  {
    id: 'breakfast',
    label: 'protein-first breakfast',
    dayPhase: 'phase1',
    suggested: false,
    why: 'blood sugar + appetite regulation. skip if you fast comfortably.',
  },
  {
    id: 'nervous-system-reset',
    label: 'breathwork (2 min)',
    dayPhase: 'phase1',
    suggested: false,
    why: 'cyclic sighing lowers cortisol fast. pick if you already practice.',
  },
];

// Phase 2 · 9–15h post-wake (wind-down window)
// Wind-down ritual replaces the old bedtime+phone-off+evening-anchor triple.
const PHASE_2_OPTIONS: HabitOption[] = [
  {
    id: 'calorie-log',
    label: 'capstone anchor',
    dayPhase: 'phase2',
    suggested: true,
    why: 'the one habit that directly serves your goal. rename to fit — log calories, log steps, log writing time.',
  },
  {
    id: 'evening-anchor',
    label: 'wind-down ritual',
    dayPhase: 'phase2',
    suggested: true,
    why: 'screens off + lights low + same bedtime. one signal, not three. sleep quality depends on it.',
  },
  {
    id: 'evening-journal',
    label: 'journal (3 sentences)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'clears rumination. cuts sleep-onset by ~9 min in trials.',
  },
  {
    id: 'nsdr',
    label: 'nsdr / yoga nidra (10 min)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'non-sleep deep rest. restores dopamine + focus without sleeping.',
  },
  {
    id: 'phone-off-reading',
    label: 'read fiction (10 min)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'lowers cortisol measurably. displaces the scroll.',
  },
];

const TARGET_PHASE_1 = 4;
const TARGET_PHASE_2 = 2;
const TOTAL_TARGET = TARGET_PHASE_1 + TARGET_PHASE_2;

function loadSelected(): string[] {
  const raw = storage.getString('onboarding.selectedHabits');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [
    ...PHASE_1_OPTIONS.filter((h) => h.suggested).map((h) => h.id).slice(0, TARGET_PHASE_1),
    ...PHASE_2_OPTIONS.filter((h) => h.suggested).map((h) => h.id).slice(0, TARGET_PHASE_2),
  ];
}

export default function HabitsScreen() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(loadSelected()));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const p1Count = PHASE_1_OPTIONS.filter((o) => selected.has(o.id)).length;
  const p2Count = PHASE_2_OPTIONS.filter((o) => selected.has(o.id)).length;
  const total = selected.size;
  const isValid = total === TOTAL_TARGET && p1Count === TARGET_PHASE_1 && p2Count === TARGET_PHASE_2;

  function toggle(opt: HabitOption) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt.id)) {
        next.delete(opt.id);
        return next;
      }
      const phaseOptions = opt.dayPhase === 'phase1' ? PHASE_1_OPTIONS : PHASE_2_OPTIONS;
      const cap = opt.dayPhase === 'phase1' ? TARGET_PHASE_1 : TARGET_PHASE_2;
      const currentPhaseSelected = phaseOptions.filter((o) => next.has(o.id));
      if (currentPhaseSelected.length >= cap) {
        const evictable =
          currentPhaseSelected.find((o) => !o.suggested) ?? currentPhaseSelected[currentPhaseSelected.length - 1];
        next.delete(evictable.id);
      }
      next.add(opt.id);
      return next;
    });
  }

  function handleNext() {
    if (!isValid) return;
    storage.set('onboarding.selectedHabits', JSON.stringify(Array.from(selected)));
    setOnboardingLastScreen(4);
    router.push('/onboarding/notifications');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={7} current={4} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            pick your 6 habits
          </Text>

          {/* Explainer — placed at top so context lands before the picker */}
          <View style={styles.explainer}>
            <ExplainLine
              heading="phase 1 · 0–8h after waking"
              body="cortisol, dopamine, and norepinephrine are elevated. hard habits ride this chemistry. the 4 suggested ones are the highest-leverage anchors from circadian + nervous system research — wake time sets the clock, light sets the day, delaying caffeine protects natural cortisol, and movement stacks BDNF."
            />
            <ExplainLine
              heading="phase 2 · 9–15h after waking"
              body="serotonin rises, stress tapers. wind-down habits belong here. the 2 suggested ones are the capstone anchor (habit that serves your goal) and a compound wind-down (screens off + lights low + bedtime — one signal, not three)."
            />
            <ExplainLine
              heading="21-day cycle"
              body="not when the habit is 'formed'. when you stop tracking and see what your body holds on its own. day 21 = review. some carry forward, some drop, some get swapped. three cycles = 63 days = deep."
            />
            <ExplainLine
              heading="the 4-of-6 rule"
              body="you don't need all 6 every day. 4 = present. that's the whole point — a day where you did enough is a day that counts."
            />
          </View>

          <Text variant="label" style={styles.pickPrompt}>
            {TARGET_PHASE_1} morning · {TARGET_PHASE_2} evening. tap "why this one?" on any tile.
          </Text>

          <HabitGroup
            title="phase 1 — morning window"
            hint={`${p1Count} of ${TARGET_PHASE_1}`}
            options={PHASE_1_OPTIONS}
            selected={selected}
            expandedId={expandedId}
            onExpand={setExpandedId}
            onToggle={toggle}
          />

          <HabitGroup
            title="phase 2 — evening window"
            hint={`${p2Count} of ${TARGET_PHASE_2}`}
            options={PHASE_2_OPTIONS}
            selected={selected}
            expandedId={expandedId}
            onExpand={setExpandedId}
            onToggle={toggle}
          />

          <Text variant="label" style={styles.micro}>
            swap any of these after your first 21-day review. the goal isn't the perfect stack — it's the one you'll actually run.
          </Text>
        </View>

        <Button
          label={isValid ? 'next' : `pick ${TOTAL_TARGET - total} more`}
          onPress={handleNext}
          disabled={!isValid}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ExplainLine({ heading, body }: { heading: string; body: string }) {
  return (
    <View style={styles.explainRow}>
      <Text variant="bodySemibold" color={Colors.tealText} size={13}>{heading}</Text>
      <Text variant="label" color={Colors.textSecondary} style={styles.explainBody}>{body}</Text>
    </View>
  );
}

function HabitGroup({
  title,
  hint,
  options,
  selected,
  expandedId,
  onExpand,
  onToggle,
}: {
  title: string;
  hint: string;
  options: HabitOption[];
  selected: Set<string>;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onToggle: (opt: HabitOption) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text variant="label" style={styles.groupTitle}>{title}</Text>
        <Text variant="label" color={Colors.tealText} style={styles.groupHint}>{hint}</Text>
      </View>
      <View style={styles.options}>
        {options.map((opt) => {
          const isSelected = selected.has(opt.id);
          const isExpanded = expandedId === opt.id;
          return (
            <View key={opt.id} style={[styles.tile, isSelected && styles.tileSelected]}>
              <TouchableOpacity
                onPress={() => onToggle(opt)}
                style={styles.tileHeader}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.tileText}>
                  <Text
                    variant="body"
                    color={isSelected ? Colors.tealText : Colors.textSecondary}
                  >
                    {opt.label}
                  </Text>
                </View>
                <View style={[styles.check, isSelected && styles.checkOn]} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onExpand(isExpanded ? null : opt.id)}
                accessibilityRole="button"
                accessibilityLabel={isExpanded ? 'hide reasoning' : 'show reasoning'}
              >
                <Text variant="label" color={Colors.textTertiary} style={styles.whyLink}>
                  {isExpanded ? 'hide why' : 'why this one?'}
                </Text>
              </TouchableOpacity>
              {isExpanded && (
                <Text variant="label" color={Colors.textSecondary} style={styles.whyBody}>
                  {opt.why}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { gap: 20, paddingVertical: 20 },
  question: { lineHeight: 36 },
  subtitle: { color: Colors.textTertiary, fontSize: 13, letterSpacing: 0.4, marginTop: -8, lineHeight: 18 },
  pickPrompt: { color: Colors.textSecondary, fontSize: 13, letterSpacing: 0.4, lineHeight: 18, marginTop: 4 },
  explainer: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  explainRow: { gap: 4 },
  explainBody: { fontSize: 12, lineHeight: 18 },
  group: { gap: 10 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupTitle: { color: Colors.textSecondary, letterSpacing: 0.6, fontSize: 12 },
  groupHint: { fontSize: 12 },
  options: { gap: 8 },
  tile: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  tileSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  tileText: { flex: 1, gap: 2 },
  whyLink: { fontSize: 11, letterSpacing: 0.4 },
  whyBody: { fontSize: 12, lineHeight: 18, paddingTop: 4 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  checkOn: {
    borderColor: Colors.tealAction,
    backgroundColor: Colors.tealAction,
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
