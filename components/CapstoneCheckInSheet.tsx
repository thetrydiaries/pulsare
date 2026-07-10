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
import { getUser, addCapstoneEntry, getLatestCapstoneEntry } from '@/lib/storage';
import { getLogicalDate } from '@/lib/dayBoundary';
import { getSundayOfWeek } from '@/lib/cycle';
import type { CapstoneEntry } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CapstoneCheckInSheet({ visible, onClose }: Props) {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    const latest = getLatestCapstoneEntry();
    setValue(latest?.value?.toString() ?? '');
    setNote('');
  }, [visible]);

  const user = getUser();
  const capstone = user?.capstone;
  const unit = capstone?.unit ?? '';
  const start = capstone?.startValue;
  const target = capstone?.targetValue;
  const numeric = Number(value);
  const parsed = value.trim() && !Number.isNaN(numeric) ? numeric : null;
  const isValid = parsed !== null;

  const delta = parsed !== null && start !== undefined ? parsed - start : null;
  const remaining = parsed !== null && target !== undefined ? parsed - target : null;

  function handleSave() {
    if (parsed === null) return;
    const entry: CapstoneEntry = {
      date: getSundayOfWeek(getLogicalDate()),
      value: parsed,
      note: note.trim() || undefined,
    };
    addCapstoneEntry(entry);
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
              <Text variant="serifItalic" size={28}>this week</Text>
              <Text variant="label" style={styles.headerSub}>
                a number, not a verdict. it's just the signal you're checking.
              </Text>
            </View>

            {capstone && (
              <View style={styles.capstoneMeta}>
                <Text variant="label" style={styles.metaLabel}>capstone</Text>
                <Text variant="body" color={Colors.textSecondary} size={15}>{capstone.goal}</Text>
              </View>
            )}

            <View style={styles.inputBlock}>
              <Text variant="label" style={styles.inputLabel}>weight</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={setValue}
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                  accessibilityLabel="weight"
                />
                {unit ? (
                  <Text variant="body" color={Colors.textTertiary} size={18}>{unit}</Text>
                ) : null}
              </View>
              {delta !== null && start !== undefined && (
                <Text variant="label" color={Colors.textTertiary} style={styles.deltaLine}>
                  {delta === 0 ? 'same as day 1' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit} from day 1`}
                  {remaining !== null && target !== undefined && (
                    ` · ${Math.abs(remaining).toFixed(1)}${unit} to target`
                  )}
                </Text>
              )}
            </View>

            <View style={styles.inputBlock}>
              <Text variant="label" style={styles.inputLabel}>note (optional)</Text>
              <TextInput
                style={styles.note}
                placeholder="what changed this week?"
                placeholderTextColor={Colors.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                accessibilityLabel="capstone note"
              />
            </View>

            <Text variant="label" style={styles.micro}>
              the number is a signal, not a scorecard. one week isn't a trend — three consecutive weeks is. keep logging even when it doesn't move.
            </Text>

            <Button label="save" onPress={handleSave} disabled={!isValid} style={styles.button} />
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text variant="label" color={Colors.textTertiary} style={styles.later}>
                skip this week
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48, gap: 20 },
  header: { gap: 6 },
  headerSub: { color: Colors.textTertiary, fontSize: 13, lineHeight: 18 },
  capstoneMeta: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  metaLabel: { fontSize: 11, letterSpacing: 0.6, color: Colors.textTertiary },
  inputBlock: { gap: 8 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, letterSpacing: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  numberInput: {
    flex: 1,
    fontFamily: 'Playfair_400Regular',
    fontSize: 32,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  deltaLine: { fontSize: 12 },
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
  button: { marginTop: 4 },
  later: { textAlign: 'center', paddingVertical: 12, marginTop: -4 },
});
