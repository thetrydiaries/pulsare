import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';

const PRESETS = [
  'Morning walk',
  'Walk with someone',
  'Swim',
  'Cycle',
  'Yoga / stretching',
];

export default function MovementScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function handleSelect(opt: string) {
    setSelected(opt);
    setShowCustom(false);
    setCustom('');
  }

  function handleCustom() {
    setSelected(null);
    setShowCustom(true);
  }

  const value = showCustom ? custom.trim() : selected;

  function handleNext() {
    if (!value) return;
    storage.set('onboarding.movement', value);
    router.push('/onboarding/breathwork');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={12} current={5} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            How do you want to move in the mornings?
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
                Something else
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
          </View>

          <Text variant="label" style={styles.micro}>
            In Phase 1, this isn't exercise — it's a signal. Low-intensity morning movement helps reset cortisol rhythm and tells your nervous system the day is safe to begin. Outdoors is best, but not required.
          </Text>
        </View>

        <Button label="next" onPress={handleNext} disabled={!value} style={styles.button} />
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
