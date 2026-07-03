import React, { useState } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getUser } from '@/lib/storage';
import { getPhaseCandidates, instantiatePhaseHabit } from '@/lib/habits';
import type { Habit, Phase } from '@/types';

// Static preview labels for phases that haven't unlocked yet.
const PHASE_2_HABITS = [
  'consistent bedtime',
  'breakfast within 90 min',
  'morning pages',
  'phone-off reading',
];

const PHASE_3_HABITS = [
  'project hour',
  'protected sleep',
  'diet anchor',
];

interface CandidateRow {
  suggestedId: string;
  label: string;
  alreadyActive: boolean;
}

interface PhaseCardProps {
  phase: Phase;
  currentPhase: Phase;
  name: string;
  weeks: string;
  description: string;
  habitLabels: string[];
  unlockLabel?: string;
  // When the phase is unlocked, the real catalog is passed so remaining habits
  // can be added one at a time — honouring the "add the rest anytime" promise.
  candidates?: CandidateRow[];
  onAdd?: (suggestedId: string) => void;
}

function PhaseCard({ phase, currentPhase, name, weeks, description, habitLabels, unlockLabel, candidates, onAdd }: PhaseCardProps) {
  const isCurrent = phase === currentPhase;
  const nameColor = isCurrent
    ? Colors.tealText
    : phase === (currentPhase + 1 as Phase)
    ? Colors.textSecondary
    : Colors.textTertiary;

  return (
    <View style={[cardStyles.card, isCurrent && cardStyles.cardCurrent]}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.titleBlock}>
          <Text variant="bodySemibold" color={nameColor}>
            phase {phase} · {name}
          </Text>
          <Text variant="label" color={Colors.textTertiary} style={cardStyles.weeks}>
            {weeks}
          </Text>
        </View>
        {isCurrent ? (
          <Text variant="label" color={Colors.tealText}>you are here</Text>
        ) : unlockLabel ? (
          <Text variant="label" color={Colors.textTertiary}>{unlockLabel}</Text>
        ) : null}
      </View>

      <Text variant="label" color={Colors.textSecondary} style={cardStyles.description}>
        {description}
      </Text>

      <View style={cardStyles.habitList}>
        {candidates
          ? candidates.map((c) => (
              c.alreadyActive ? (
                <View key={c.suggestedId} style={cardStyles.candidateRow}>
                  <Text variant="label" color={Colors.textSecondary} style={cardStyles.habitItem}>
                    — {c.label}
                  </Text>
                  <Text variant="label" color={Colors.tealText} style={cardStyles.addedTag}>added</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={c.suggestedId}
                  style={cardStyles.candidateRow}
                  onPress={() => onAdd?.(c.suggestedId)}
                  accessibilityRole="button"
                  accessibilityLabel={`add ${c.label}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text variant="label" color={Colors.textTertiary} style={cardStyles.habitItem}>
                    — {c.label}
                  </Text>
                  <Text variant="label" color={Colors.tealText} style={cardStyles.addTag}>+ add</Text>
                </TouchableOpacity>
              )
            ))
          : habitLabels.map((label, i) => (
              <Text key={i} variant="label" color={Colors.textTertiary} style={cardStyles.habitItem}>
                — {label}
              </Text>
            ))}
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  currentPhase: Phase;
  habits: Habit[];
  onHabitsChanged?: () => void; // called after a catalog habit is added from here
}

export default function PhaseExplainerModal({ visible, onClose, currentPhase, habits, onHabitsChanged }: Props) {
  const insets = useSafeAreaInsets();
  const [refresh, setRefresh] = useState(0);

  const phase1Labels = habits
    .filter((h) => h.phase === 1 && h.active)
    .map((h) => h.userLabel ?? h.label);

  const fallbackPhase1 = [
    'wake up alarm',
    'water before coffee',
    'morning movement',
    'nervous system reset',
    'evening anchor',
  ];

  const user = getUser();
  // Only surface the addable catalog once the phase is actually unlocked.
  const phase2Candidates =
    user && currentPhase >= 2 ? getPhaseCandidates(2, user) : undefined;
  const phase3Candidates =
    user && currentPhase >= 3 ? getPhaseCandidates(3, user) : undefined;

  function handleAdd(suggestedId: string) {
    if (!user) return;
    instantiatePhaseHabit(suggestedId, user);
    setRefresh((n) => n + 1); // re-render candidate rows as "added"
    onHabitsChanged?.();
  }
  void refresh;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap backdrop to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Title row */}
          <View style={styles.titleRow}>
            <Text variant="serifItalic" size={22} style={styles.heading}>
              the shape of your reset
            </Text>
          </View>
          <Text variant="label" color={Colors.textSecondary} style={styles.subheading}>
            three phases. each one builds on the last, and you choose what to add.
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <PhaseCard
              phase={1}
              currentPhase={currentPhase}
              name="stabilise"
              weeks="week 1"
              description="the foundation. five anchors that regulate your nervous system before anything else is added."
              habitLabels={phase1Labels.length > 0 ? phase1Labels : fallbackPhase1}
            />
            <PhaseCard
              phase={2}
              currentPhase={currentPhase}
              name="build"
              weeks="from week 2"
              description="consistency earns complexity. new habits to layer on — start with one, add the rest when you're ready."
              habitLabels={PHASE_2_HABITS}
              candidates={phase2Candidates}
              onAdd={handleAdd}
              unlockLabel={currentPhase < 2 ? 'unlocks week 2' : undefined}
            />
            <PhaseCard
              phase={3}
              currentPhase={currentPhase}
              name="raise the stakes"
              weeks="from week 4"
              description="protect what works, and point it at something real — your project enters, one hour a day."
              habitLabels={PHASE_3_HABITS}
              candidates={phase3Candidates}
              onAdd={handleAdd}
              unlockLabel={currentPhase < 3 ? 'unlocks week 4' : undefined}
            />

            <Text variant="label" color={Colors.textTertiary} style={styles.footer}>
              phases unlock as you go — the pacing is part of the protocol. add one habit at a time; that's how they hold.
            </Text>
          </ScrollView>

          {/* Done button — always visible at the bottom */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.doneBtn}
            accessibilityRole="button"
            accessibilityLabel="close"
          >
            <Text variant="bodySemibold" color={Colors.tealText}>done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  titleRow: {
    marginBottom: 4,
  },
  heading: {
    lineHeight: 32,
  },
  subheading: {
    lineHeight: 20,
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scroll: {
    gap: 12,
    paddingBottom: 8,
  },
  footer: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardCurrent: {
    borderColor: Colors.tealAction,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: { gap: 3, flex: 1 },
  weeks: { fontSize: 12 },
  description: {
    lineHeight: 20,
    fontSize: 13,
  },
  habitList: { gap: 4 },
  habitItem: { fontSize: 13, flexShrink: 1 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  addTag: { fontSize: 12 },
  addedTag: { fontSize: 12, opacity: 0.7 },
});
