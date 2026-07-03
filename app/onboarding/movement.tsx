import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

const PRESETS = [
  'morning walk',
  'walk with someone',
  'swim',
  'cycle',
  'yoga / stretching',
];

export default function MovementScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [userLabel, setUserLabel] = useState('');

  function handleSelect(opt: string) {
    setSelected(opt);
    setShowCustom(false);
    setCustom('');
    setUserLabel('');
  }

  function handleCustom() {
    setSelected(null);
    setShowCustom(true);
    setUserLabel('');
  }

  const activityValue = showCustom ? custom.trim() : selected;
  const hasSelection = !!activityValue;

  function handleNext() {
    if (!activityValue) return;
    storage.set('onboarding.movement', activityValue);
    if (userLabel.trim()) {
      storage.set('onboarding.movementUserLabel', userLabel.trim());
    }
    setOnboardingLastScreen(3);
    router.push('/onboarding/evening');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={7} current={3} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            how do you want to move in the mornings?
          </Text>

          <View style={styles.options}>
            {PRESETS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.tile, selected === opt && !showCustom && styles.tileSelected]}
                onPress={() => handleSelect(opt)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === opt && !showCustom }}
              >
                <Text
                  variant="body"
                  color={selected === opt && !showCustom ? Colors.tealText : Colors.textSecondary}
                >
                  {opt}
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
                placeholder="what do you do?"
                placeholderTextColor={Colors.textTertiary}
                value={custom}
                onChangeText={setCustom}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="describe your movement"
              />
            )}

            {hasSelection && !showCustom && (
              <TextInput
                style={styles.labelInput}
                placeholder={activityValue ?? ''}
                placeholderTextColor={Colors.textTertiary}
                value={userLabel}
                onChangeText={setUserLabel}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="what do you call this habit"
              />
            )}
            {hasSelection && !showCustom && (
              <Text variant="label" style={styles.labelHint}>
                what do you call this?
              </Text>
            )}
          </View>

          <Text variant="label" style={styles.micro}>
            in phase 1, this isn't exercise — it's a signal. low-intensity morning movement helps reset cortisol rhythm and tells your nervous system the day is safe to begin. outdoors is best, but not required.
          </Text>
        </View>

        <Button label="next" onPress={handleNext} disabled={!activityValue} style={styles.button} />
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
  labelHint: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: -4,
  },
  labelInput: {
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    marginTop: 4,
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
