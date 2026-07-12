import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getLogEntry, updateLogEntry, getUser } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import { recalculateStreak } from '@/lib/presence';
import { parseDate } from '@/lib/dayBoundary';
import type { Habit } from '@/types';

interface Props {
  date: string | null;
  onClose: () => void;
}

function formatDisplayDate(date: string): string {
  return parseDate(date)
    .toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })
    .toLowerCase();
}

export default function PastDayEditSheet({ date, onClose }: Props) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [bodyWord, setBodyWord] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (!date) return;
    const user = getUser();
    if (!user) return;
    setHabits(getActiveHabits());
    const entry = getLogEntry(date);
    setCompleted(entry?.habits ?? {});
    setBodyWord(entry?.bodyCheckWord ?? '');
  }, [date]);

  function handleToggle(id: string) {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    if (date) updateLogEntry(date, { habits: next });
  }

  function handleBodyWord(text: string) {
    setBodyWord(text);
    if (date) updateLogEntry(date, { bodyCheckWord: text || null });
  }

  function handleClose() {
    recalculateStreak();
    onClose();
  }

  const morning = habits.filter((h) => h.group === 'morning');
  const evening = habits.filter((h) => h.group === 'evening');

  return (
    <Modal
      visible={!!date}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {date && (
              <Text variant="label" style={styles.dateHeader}>
                {formatDisplayDate(date)}
              </Text>
            )}

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {morning.length > 0 && (
                <View style={styles.group}>
                  <Text variant="label" style={styles.groupLabel}>morning</Text>
                  {morning.map((h) => (
                    <ToggleRow
                      key={h.id}
                      label={h.userLabel ?? h.label}
                      completed={!!completed[h.id]}
                      onToggle={() => handleToggle(h.id)}
                    />
                  ))}
                </View>
              )}

              {evening.length > 0 && (
                <View style={styles.group}>
                  <Text variant="label" style={styles.groupLabel}>evening</Text>
                  {evening.map((h) => (
                    <ToggleRow
                      key={h.id}
                      label={h.userLabel ?? h.label}
                      completed={!!completed[h.id]}
                      onToggle={() => handleToggle(h.id)}
                    />
                  ))}
                </View>
              )}

              <TextInput
                style={styles.bodyCheck}
                placeholder="one word — how did your body feel?"
                placeholderTextColor={Colors.textTertiary}
                value={bodyWord}
                onChangeText={(t) => handleBodyWord(t.toLowerCase())}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="body check for this day"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="done editing"
            >
              <Text variant="bodySemibold" color={Colors.tealText} size={15}>done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ToggleRow({
  label,
  completed,
  onToggle,
}: {
  label: string;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <Text
        variant="body"
        color={completed ? Colors.tealText : Colors.textPrimary}
        style={rowStyles.label}
        size={15}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={onToggle}
        style={rowStyles.checkTarget}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${label}, ${completed ? 'complete' : 'not complete'}`}
      >
        <View style={[rowStyles.circle, completed && rowStyles.circleCompleted]}>
          {completed && (
            <Text variant="micro" color={Colors.background} size={12}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  dateHeader: {
    marginBottom: 8,
    letterSpacing: 0.6,
    color: Colors.textSecondary,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 8,
  },
  group: {
    gap: 0,
  },
  groupLabel: {
    marginBottom: 4,
    letterSpacing: 1.2,
  },
  bodyCheck: {
    fontFamily: 'Outfit_300Light',
    fontSize: 16,
    color: Colors.textSecondary,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  doneBtn: {
    marginTop: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.tealAction,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  label: {
    flex: 1,
    paddingRight: 12,
  },
  checkTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: Colors.tealAction,
    borderColor: Colors.tealAction,
  },
});
