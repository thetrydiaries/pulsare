import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { getUser } from '@/lib/storage';
import { getPhaseCandidates } from '@/lib/habits';
import { acceptPhaseUnlock, deferPhaseUnlock } from '@/lib/progression';
import type { Phase } from '@/types';

interface PhaseCopy {
  eyebrow: string;
  title: string;
  intro: (projectName: string | null) => string;
  chooseLabel: string;
}

const PHASE_COPY: Record<2 | 3, PhaseCopy> = {
  2: {
    eyebrow: 'week two · build',
    title: 'you held the base.',
    intro: () =>
      'a full week of showing up — that\'s the hard part, done. now you get to make it yours. add one thing to start. just one.',
    chooseLabel: 'what to add first',
  },
  3: {
    eyebrow: 'week four · raise the stakes',
    title: 'time to point it somewhere.',
    intro: (projectName) =>
      projectName
        ? `the protocol is steady. you told me you wanted to work on ${projectName} — it\'s time. one hour a day, and the first two minutes are the whole habit.`
        : 'the protocol is steady. now it earns something bigger: one protected hour a day on your own work. the first two minutes are the whole habit.',
    chooseLabel: 'what enters the protocol',
  },
};

export default function UnlockScreen() {
  const params = useLocalSearchParams<{ phase?: string }>();
  const phase = (Number(params.phase) === 3 ? 3 : 2) as 2 | 3;
  const user = getUser();

  const candidates = useMemo(
    () => (user ? getPhaseCandidates(phase as Phase, user).filter((c) => !c.alreadyActive) : []),
    [phase, user?.projectName],
  );

  // Pre-select the headline habit — a low-friction default that still adopts one thing.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(candidates.filter((c) => c.headline).map((c) => c.suggestedId)),
  );
  // Guards against a rapid double-tap firing accept/defer twice before the
  // screen unmounts (instantiatePhaseHabit is idempotent, but don't rely on it).
  const [navigating, setNavigating] = useState(false);

  if (!user) return null;

  const copy = PHASE_COPY[phase];
  const projectName = user.projectName?.trim() || null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBegin() {
    if (navigating) return;
    setNavigating(true);
    acceptPhaseUnlock(phase, [...selected]);
    router.replace('/(tabs)');
  }

  function handleNotYet() {
    if (navigating) return;
    setNavigating(true);
    deferPhaseUnlock(phase);
    router.replace('/(tabs)');
  }

  const count = selected.size;
  const beginLabel = count === 0 ? `begin phase ${phase}` : `begin — add ${count === 1 ? 'this' : `these ${count}`}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="label" color={Colors.tealText} style={styles.eyebrow}>
            {copy.eyebrow}
          </Text>
          <Text variant="serifItalic" size={40} style={styles.title}>
            {copy.title}
          </Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.intro}>
            {copy.intro(projectName)}
          </Text>
        </View>

        <Text variant="label" color={Colors.textTertiary} style={styles.chooseLabel}>
          {copy.chooseLabel}
        </Text>

        <View style={styles.list}>
          {candidates.map((c) => {
            const isSelected = selected.has(c.suggestedId);
            return (
              <TouchableOpacity
                key={c.suggestedId}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggle(c.suggestedId)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${c.label}. ${c.stackIntro}`}
              >
                <View style={[styles.check, isSelected && styles.checkOn]}>
                  {isSelected && <View style={styles.checkDot} />}
                </View>
                <View style={styles.rowText}>
                  <Text variant="body" color={isSelected ? Colors.textPrimary : Colors.textSecondary}>
                    {c.label}
                  </Text>
                  <Text variant="label" color={Colors.textTertiary} style={styles.stackIntro}>
                    {c.stackIntro}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text variant="label" color={Colors.textTertiary} style={styles.footnote}>
          you can add the rest anytime — one at a time is how they stick.
        </Text>
      </ScrollView>

      <View style={styles.actions}>
        <Button label={beginLabel} onPress={handleBegin} disabled={navigating} />
        <Button label="not yet" variant="ghost" onPress={handleNotYet} disabled={navigating} style={styles.notYet} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 24 },
  header: { gap: 14, marginBottom: 32 },
  eyebrow: { letterSpacing: 1.2 },
  title: { lineHeight: 46 },
  intro: { lineHeight: 24 },
  chooseLabel: { letterSpacing: 1.2, marginBottom: 12 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  rowSelected: {
    borderColor: Colors.tealAction,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkOn: {
    borderColor: Colors.tealText,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tealText,
  },
  rowText: { flex: 1, gap: 3 },
  stackIntro: { lineHeight: 16 },
  footnote: { marginTop: 20, lineHeight: 18, fontSize: 12 },
  actions: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  notYet: { opacity: 0.8 },
});
