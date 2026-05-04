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
} from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';

interface Props {
  visible: boolean;
  defaultGroup: 'morning' | 'evening';
  onClose: () => void;
  onAdd: (name: string, group: 'morning' | 'evening') => void;
}

export default function CustomHabitSheet({ visible, defaultGroup, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<'morning' | 'evening'>(defaultGroup);

  useEffect(() => {
    if (visible) {
      setName('');
      setGroup(defaultGroup);
    }
  }, [visible, defaultGroup]);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, group);
    onClose();
  }

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
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <TextInput
              style={styles.input}
              placeholder="e.g. no alcohol, call someone, get outside"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={(t) => setName(t.slice(0, 40))}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              accessibilityLabel="habit name"
            />

            {name.trim().length > 0 && (
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

            <Button
              label="add habit"
              onPress={handleAdd}
              disabled={!name.trim()}
              style={styles.button}
            />
          </View>
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
  button: { marginTop: 4 },
});
