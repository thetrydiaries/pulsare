import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import type { Habit, Phase } from '@/types';

const PHASE_2_HABITS = [
  'consistent bedtime',
  'breakfast within 90 min',
  'morning pages',
  'phone-off reading',
  'project hour',
];

const PHASE_3_HABITS = [
  'diet anchor',
  'protected sleep',
  'project output',
];

interface PhaseCardProps {
  phase: Phase;
  currentPhase: Phase;
  name: string;
  weeks: string;
  description: string;
  habitLabels: string[];
  unlockLabel?: string;
}

function PhaseCard({ phase, currentPhase, name, weeks, description, habitLabels, unlockLabel }: PhaseCardProps) {
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
        {habitLabels.map((label, i) => (
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
}

export default function PhaseExplainerModal({ visible, onClose, currentPhase, habits }: Props) {
  const insets = useSafeAreaInsets();

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
            three phases. thirteen weeks. each one builds on the last.
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
              weeks="weeks 1–3"
              description="the foundation. five anchors that regulate your nervous system before anything else is added."
              habitLabels={phase1Labels.length > 0 ? phase1Labels : fallbackPhase1}
            />
            <PhaseCard
              phase={2}
              currentPhase={currentPhase}
              name="build"
              weeks="weeks 4–8"
              description="consistency earns complexity. five new habits, added to what you've already built."
              habitLabels={PHASE_2_HABITS}
              unlockLabel={currentPhase < 2 ? 'unlocks at week 4' : undefined}
            />
            <PhaseCard
              phase={3}
              currentPhase={currentPhase}
              name="raise the stakes"
              weeks="weeks 9–13"
              description="protect what works. three more anchors — diet, sleep as infrastructure, and deeper project time."
              habitLabels={PHASE_3_HABITS}
              unlockLabel={currentPhase < 3 ? 'unlocks at week 9' : undefined}
            />

            <Text variant="label" color={Colors.textTertiary} style={styles.footer}>
              phases unlock when you're ready — not on a timer.
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
  habitItem: { fontSize: 13 },
});
