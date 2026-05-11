import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';
import type { EveningHabitType } from '@/types';

const PRESETS: { type: EveningHabitType; label: string; shortLabel: string }[] = [
  { type: 'reading',    label: 'Reading — fiction or otherwise', shortLabel: 'reading' },
  { type: 'phone-off', label: 'Phone off — no screens after a chosen time', shortLabel: 'phone off' },
  { type: 'breathwork', label: 'Breathwork — a wind-down practice', shortLabel: 'evening breathwork' },
  { type: 'journalling', label: 'Journalling — three sentences', shortLabel: 'journalling' },
];

export default function EveningScreen() {
  const [selected, setSelected] = useState<EveningHabitType | null>(null);
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [userLabel, setUserLabel] = useState('');

  const selectedPreset = PRESETS.find((p) => p.type === selected);

  function handleSelect(type: EveningHabitType) {
    setSelected(type);
    setShowCustom(false);
    setCustom('');
    setUserLabel('');
  }

  function handleCustom() {
    setSelected(null);
    setShowCustom(true);
    setUserLabel('');
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
    if (userLabel.trim()) {
      storage.set('onboarding.eveningUserLabel', userLabel.trim());
    }
    setOnboardingLastScreen(7);
    router.push('/onboarding/custom-habit');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={13} current={7} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            how do you want to end your day?
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
                  {p.label.toLowerCase()}
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
                something else
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

            {selectedPreset && (
              <View style={styles.labelBlock}>
                <Text variant="label" style={styles.labelHint}>
                  what do you call this?
                </Text>
                <TextInput
                  style={styles.labelInput}
                  placeholder={selectedPreset.shortLabel}
                  placeholderTextColor={Colors.textTertiary}
                  value={userLabel}
                  onChangeText={setUserLabel}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  accessibilityLabel="what do you call this habit"
                />
              </View>
            )}
          </View>

          <Text variant="label" style={styles.micro}>
            your evening anchor is as important as your morning one. the nervous system needs a consistent signal that the day is ending. choose something you'll actually do.
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
  labelBlock: { gap: 6, marginTop: 4 },
  labelHint: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  labelInput: {
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
