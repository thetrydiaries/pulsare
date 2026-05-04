import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';
import type { EveningHabitType } from '@/types';

const PRESETS: { type: EveningHabitType; label: string }[] = [
  { type: 'reading', label: 'Reading — fiction or otherwise' },
  { type: 'phone-off', label: 'Phone off — no screens after a chosen time' },
  { type: 'breathwork', label: 'Breathwork — a wind-down practice' },
  { type: 'journalling', label: 'Journalling — three sentences' },
];

export default function EveningScreen() {
  const [selected, setSelected] = useState<EveningHabitType | null>(null);
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const displayLabel = showCustom
    ? custom.trim()
    : PRESETS.find((p) => p.type === selected)?.label ?? '';

  function handleSelect(type: EveningHabitType) {
    setSelected(type);
    setShowCustom(false);
    setCustom('');
  }

  function handleCustom() {
    setSelected(null);
    setShowCustom(true);
  }

  const isValid = showCustom ? !!custom.trim() : !!selected;

  function handleNext() {
    if (!isValid) return;
    const type: EveningHabitType = showCustom ? 'custom' : selected!;
    const label = showCustom
      ? custom.trim()
      : PRESETS.find((p) => p.type === selected)!.label;
    storage.set('onboarding.eveningHabitType', type);
    storage.set('onboarding.eveningHabitLabel', label);
    router.push('/onboarding/notifications');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={12} current={7} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            How do you want to end your day?
          </Text>

          <View style={styles.options}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.type}
                style={[styles.tile, selected === p.type && !showCustom && styles.tileSelected]}
                onPress={() => handleSelect(p.type)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === p.type && !showCustom }}
              >
                <Text
                  variant="body"
                  color={selected === p.type && !showCustom ? Colors.tealText : Colors.textSecondary}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.tile, showCustom && styles.tileSelected]}
              onPress={handleCustom}
              accessibilityRole="radio"
              accessibilityState={{ selected: showCustom }}
            >
              <Text variant="body" color={showCustom ? Colors.tealText : Colors.textSecondary}>
                Something else
              </Text>
            </TouchableOpacity>

            {showCustom && (
              <TextInput
                style={styles.input}
                placeholder="what's your evening habit?"
                placeholderTextColor={Colors.textTertiary}
                value={custom}
                onChangeText={setCustom}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="describe your evening habit"
              />
            )}
          </View>

          <Text variant="label" style={styles.micro}>
            Your evening anchor is as important as your morning one. The nervous system needs a consistent signal that the day is ending. Choose something you'll actually do.
          </Text>
        </View>

        <Button label="next" onPress={handleNext} disabled={!isValid} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { gap: 24, paddingVertical: 24 },
  question: { lineHeight: 36 },
  options: { gap: 10 },
  tile: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    marginTop: 4,
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
