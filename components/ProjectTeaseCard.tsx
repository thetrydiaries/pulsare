import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';

interface Props {
  projectName: string | null;
  onName: (name: string) => void;
  onDismiss: () => void;
}

/**
 * Week-3 project tease — keeps the narrative alive through the deepest part of
 * the fall-off window. If she never named a project, the card asks her to name
 * one now, so the beat becomes a small action instead of a dead-end promise.
 */
export default function ProjectTeaseCard({ projectName, onName, onDismiss }: Props) {
  const [draft, setDraft] = useState('');

  return (
    <View style={styles.card}>
      <Text variant="label" color={Colors.tealText} style={styles.eyebrow}>coming next week</Text>

      {projectName ? (
        <>
          <Text variant="body" color={Colors.textSecondary} style={styles.body}>
            {projectName} is almost ready to enter the protocol — one hour a day, week four.
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="dismiss project reminder"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text variant="label" color={Colors.textTertiary} style={styles.action}>got it →</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text variant="body" color={Colors.textSecondary} style={styles.body}>
            week four adds one hour a day on something that matters to you. what have you been meaning to build?
          </Text>
          <TextInput
            style={styles.input}
            placeholder="a Substack, a side project, something that's been waiting"
            placeholderTextColor={Colors.textTertiary}
            value={draft}
            onChangeText={setDraft}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => draft.trim() && onName(draft.trim())}
            accessibilityLabel="name your project"
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => draft.trim() && onName(draft.trim())}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="save project"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="label" color={draft.trim() ? Colors.tealText : Colors.textTertiary} style={styles.action}>
                save →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="skip for now"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="label" color={Colors.textTertiary} style={styles.action}>skip</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.tealAction,
    borderRadius: 12,
    backgroundColor: `${Colors.tealAction}10`,
    gap: 10,
  },
  eyebrow: { letterSpacing: 1.2 },
  body: { lineHeight: 22, fontSize: 14 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  action: { fontSize: 13 },
});
