import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { getUser, setCycleReview, getCycleReview } from '@/lib/storage';
import {
  getActiveHabits,
  getBenchOptions,
  instantiateSeedHabit,
  setHabitActive,
  type BenchOption,
} from '@/lib/habits';
import { advanceCycle } from '@/lib/cycle';
import { getLogicalDate } from '@/lib/dayBoundary';
import type { Habit, CycleReview } from '@/types';

interface Props {
  visible: boolean;
  cycleNumber: number;
  onClose: () => void;
}

type Mark = 'stuck' | 'willpower' | 'drop';

export default function CycleReviewSheet({ visible, cycleNumber, onClose }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [note, setNote] = useState('');
  const [bench, setBench] = useState<BenchOption[]>([]);
  const [replacements, setReplacements] = useState<string[]>([]); // suggestedIds picked off the bench

  useEffect(() => {
    if (!visible) return;
    const user = getUser();
    if (!user) return;
    setHabits(getActiveHabits());
    setBench(getBenchOptions(user));
    setReplacements([]);
    const existing = getCycleReview(cycleNumber);
    if (existing) {
      const marks: Record<string, Mark> = {};
      existing.stuck.forEach((id) => (marks[id] = 'stuck'));
      existing.willpower.forEach((id) => (marks[id] = 'willpower'));
      existing.dropped.forEach((id) => (marks[id] = 'drop'));
      setMarks(marks);
      setNote(existing.note ?? '');
    } else {
      setMarks({});
      setNote('');
    }
  }, [visible, cycleNumber]);

  const dropCount = Object.values(marks).filter((m) => m === 'drop').length;

  function setMark(id: string, mark: Mark) {
    setMarks((prev) => {
      const next = { ...prev };
      if (next[id] === mark) delete next[id];
      else next[id] = mark;
      return next;
    });
  }

  function toggleReplacement(suggestedId: string) {
    setReplacements((prev) => {
      if (prev.includes(suggestedId)) return prev.filter((id) => id !== suggestedId);
      if (prev.length >= dropCount) return prev; // one replacement per dropped slot
      return [...prev, suggestedId];
    });
  }

  function handleConfirm() {
    const user = getUser();
    if (!user) return;
    const stuck: string[] = [];
    const willpower: string[] = [];
    const dropped: string[] = [];
    for (const [id, m] of Object.entries(marks)) {
      if (m === 'stuck') stuck.push(id);
      else if (m === 'willpower') willpower.push(id);
      else if (m === 'drop') dropped.push(id);
    }

    // The review is the swap moment: dropped anchors actually come off the
    // list (logs untouched), and bench picks take their slots.
    const replacedWith: Record<string, string> = {};
    for (const id of dropped) setHabitActive(id, false);
    replacements.slice(0, dropped.length).forEach((suggestedId, i) => {
      const habit = instantiateSeedHabit(suggestedId, user);
      if (habit && dropped[i]) replacedWith[dropped[i]] = habit.id;
    });

    const review: CycleReview = {
      cycleNumber,
      completedAt: getLogicalDate(),
      stuck,
      willpower,
      dropped,
      replacedWith,
      note: note.trim() || undefined,
    };
    setCycleReview(review);
    advanceCycle();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text variant="serifItalic" size={28}>cycle {cycleNumber}</Text>
              <Text variant="label" style={styles.headerSub}>
                21 days done. before the next 21, notice what stuck.
              </Text>
            </View>

            <View style={styles.explainer}>
              <View style={styles.explainRow}>
                <Text variant="bodySemibold" color={Colors.tealText} size={13}>automatic</Text>
                <Text variant="label" color={Colors.textSecondary} style={styles.explainLine}>
                  runs without willpower now. this is the habit becoming identity.
                </Text>
              </View>
              <View style={styles.explainRow}>
                <Text variant="bodySemibold" color={Colors.textSecondary} size={13}>willpower</Text>
                <Text variant="label" color={Colors.textSecondary} style={styles.explainLine}>
                  still needs a nudge. carries forward — not everything wires in 21 days.
                </Text>
              </View>
              <View style={styles.explainRow}>
                <Text variant="bodySemibold" color={Colors.textPrimary} size={13}>drop</Text>
                <Text variant="label" color={Colors.textSecondary} style={styles.explainLine}>
                  didn't stick, or doesn't matter anymore. makes room for the next one.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text variant="label" style={styles.sectionLabel}>your habits</Text>
              {habits.map((h) => {
                const mark = marks[h.id];
                const label = h.userLabel ?? h.label;
                return (
                  <View key={h.id} style={styles.row}>
                    <Text variant="body" size={15} style={styles.rowLabel}>{label}</Text>
                    <View style={styles.markRow}>
                      <MarkPill
                        label="automatic"
                        active={mark === 'stuck'}
                        onPress={() => setMark(h.id, 'stuck')}
                      />
                      <MarkPill
                        label="willpower"
                        active={mark === 'willpower'}
                        onPress={() => setMark(h.id, 'willpower')}
                      />
                      <MarkPill
                        label="drop"
                        active={mark === 'drop'}
                        onPress={() => setMark(h.id, 'drop')}
                        danger
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {dropCount > 0 && bench.length > 0 && (
              <View style={styles.section}>
                <Text variant="label" style={styles.sectionLabel}>
                  something in {dropCount === 1 ? 'its' : 'their'} place? (optional)
                </Text>
                <Text variant="label" color={Colors.textTertiary} style={styles.benchHint}>
                  dropped anchors make room. leave the slot open if nothing calls.
                </Text>
                <View style={styles.benchWrap}>
                  {bench.map((b) => {
                    const active = replacements.includes(b.suggestedId);
                    return (
                      <TouchableOpacity
                        key={b.suggestedId}
                        onPress={() => toggleReplacement(b.suggestedId)}
                        style={[styles.pill, styles.benchPill, active && styles.benchPillActive]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: active }}
                      >
                        <Text
                          variant="label"
                          color={active ? Colors.tealText : Colors.textTertiary}
                          size={12}
                        >
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text variant="label" style={styles.sectionLabel}>anything else?</Text>
              <TextInput
                style={styles.note}
                placeholder="a sentence for future you"
                placeholderTextColor={Colors.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                accessibilityLabel="reflection note"
              />
            </View>

            <Text variant="label" style={styles.micro}>
              stuck habits carry to the next cycle. willpower ones stay too — they're not automatic yet. dropped ones make room for something new.
            </Text>

            <Button label={`start cycle ${cycleNumber + 1}`} onPress={handleConfirm} style={styles.button} />
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text variant="label" color={Colors.textTertiary} style={styles.later}>
                not yet — review later
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MarkPill({
  label,
  active,
  onPress,
  danger,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  danger?: boolean;
}) {
  const activeColor = danger ? Colors.textPrimary : Colors.tealText;
  const bgColor = danger ? `${Colors.textPrimary}22` : `${Colors.tealAction}22`;
  const borderColor = danger ? Colors.textSecondary : Colors.tealAction;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        active && { borderColor, backgroundColor: bgColor },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        variant="label"
        color={active ? activeColor : Colors.textTertiary}
        size={12}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48, gap: 24 },
  header: { gap: 6 },
  headerSub: { color: Colors.textTertiary, fontSize: 13, lineHeight: 18 },
  explainer: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  explainRow: { gap: 4 },
  explainLine: { fontSize: 12, lineHeight: 18 },
  section: { gap: 10 },
  sectionLabel: { letterSpacing: 0.6, color: Colors.textSecondary, fontSize: 12 },
  row: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  rowLabel: { color: Colors.textPrimary },
  markRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: Colors.border,
    minHeight: 30,
    justifyContent: 'center',
  },
  note: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  micro: { lineHeight: 20, fontSize: 12, color: Colors.textTertiary },
  benchHint: { fontSize: 12, lineHeight: 18 },
  benchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  benchPill: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16 },
  benchPillActive: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}22`,
  },
  button: { marginTop: 4 },
  later: { textAlign: 'center', paddingVertical: 12, marginTop: -4 },
});
