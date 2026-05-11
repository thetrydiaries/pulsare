import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import TimePicker from '@/components/ui/TimePicker';
import { getUser, getHabits } from '@/lib/storage';
import { addMinutes } from '@/lib/dayBoundary';
import type { Habit } from '@/types';

interface Props {
  visible: boolean;
  defaultGroup: 'morning' | 'evening';
  editHabit?: Habit | null;
  onClose: () => void;
  onSave: (
    name: string,
    group: 'morning' | 'evening',
    notificationTime: string | null,
    reason: string | null,
  ) => void;
}

function getDefaultNotifTime(group: 'morning' | 'evening'): string {
  const user = getUser();
  if (!user) return group === 'morning' ? '08:30' : '21:30';
  if (group === 'morning') return addMinutes(user.wakeTime, 90);
  return user.notificationTimes.windDown;
}

function getExistingCustomNotifHabit(excludeId?: string): Habit | null {
  const habits = getHabits();
  return Object.values(habits).find(
    (h) => h.isCustom && h.active && h.customNotificationTime && h.id !== excludeId,
  ) ?? null;
}

export default function CustomHabitSheet({ visible, defaultGroup, editHabit, onClose, onSave }: Props) {
  const isEdit = !!editHabit;

  const [name, setName] = useState('');
  const [group, setGroup] = useState<'morning' | 'evening'>(defaultGroup);
  const [showNotif, setShowNotif] = useState(false);
  const [notifTime, setNotifTime] = useState(() => getDefaultNotifTime(defaultGroup));
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      if (editHabit) {
        setName(editHabit.label);
        setGroup(editHabit.group);
        const hasNotif = !!editHabit.customNotificationTime;
        setShowNotif(hasNotif);
        setNotifTime(editHabit.customNotificationTime ?? getDefaultNotifTime(editHabit.group));
        setReason(editHabit.personalReason ?? '');
      } else {
        setName('');
        setGroup(defaultGroup);
        setShowNotif(false);
        setNotifTime(getDefaultNotifTime(defaultGroup));
        setReason('');
      }
    }
  }, [visible, defaultGroup, editHabit]);

  // Update default notif time when group changes
  useEffect(() => {
    if (!showNotif) setNotifTime(getDefaultNotifTime(group));
  }, [group, showNotif]);

  const conflictHabit = showNotif ? getExistingCustomNotifHabit(editHabit?.id) : null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, group, showNotif ? notifTime : null, reason.trim() || null);
    onClose();
  }

  const nameEntered = name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.handle} />

            {isEdit && (
              <Text variant="label" color={Colors.textTertiary} style={styles.modeLabel}>
                edit habit
              </Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="e.g. no alcohol, call someone, get outside"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={(t) => setName(t.toLowerCase().slice(0, 40))}
              autoCapitalize="none"
              autoFocus={!isEdit}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              accessibilityLabel="habit name"
            />

            {nameEntered && (
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.pill, group === 'morning' && styles.pillSelected]}
                  onPress={() => setGroup('morning')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: group === 'morning' }}
                >
                  <Text
                    variant="label"
                    color={group === 'morning' ? Colors.tealText : Colors.textTertiary}
                  >
                    morning
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, group === 'evening' && styles.pillSelected]}
                  onPress={() => setGroup('evening')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: group === 'evening' }}
                >
                  <Text
                    variant="label"
                    color={group === 'evening' ? Colors.tealText : Colors.textTertiary}
                  >
                    evening
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {nameEntered && (
              <View style={styles.optionalSection}>
                <TouchableOpacity
                  style={styles.optionalToggle}
                  onPress={() => setShowNotif((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: showNotif }}
                >
                  <Text variant="label" color={showNotif ? Colors.tealText : Colors.textTertiary}>
                    {showNotif ? 'remind me at ↓' : 'add a reminder (optional)'}
                  </Text>
                </TouchableOpacity>

                {showNotif && (
                  <>
                    <View style={styles.timePickerWrap}>
                      <TimePicker
                        value={notifTime}
                        onChange={setNotifTime}
                        label="remind me at"
                      />
                    </View>
                    {conflictHabit && (
                      <Text variant="label" color={Colors.textTertiary} style={styles.conflictNote}>
                        you already have a reminder set for {conflictHabit.userLabel ?? conflictHabit.label}. adding this will replace it.
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}

            {nameEntered && (
              <View style={styles.optionalSection}>
                <Text variant="label" color={Colors.textTertiary} style={styles.reasonLabel}>
                  why does this matter to you? (optional)
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="for me, because..."
                  placeholderTextColor={Colors.textTertiary}
                  value={reason}
                  onChangeText={(t) => setReason(t.slice(0, 80))}
                  multiline
                  returnKeyType="default"
                  blurOnSubmit={false}
                  accessibilityLabel="personal reason for this habit"
                />
                {reason.length > 60 && (
                  <Text variant="label" color={Colors.textTertiary} style={styles.charCount}>
                    {80 - reason.length} left
                  </Text>
                )}
              </View>
            )}

            <Button
              label={isEdit ? 'save changes' : 'add habit'}
              onPress={handleSave}
              disabled={!name.trim()}
              style={styles.button}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    letterSpacing: 0.8,
  },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  optionalSection: {
    gap: 8,
  },
  optionalToggle: {
    paddingVertical: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  timePickerWrap: {
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  conflictNote: {
    lineHeight: 18,
    fontSize: 12,
  },
  reasonLabel: {
    fontSize: 12,
    lineHeight: 18,
  },
  reasonInput: {
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  button: { marginTop: 4 },
});
