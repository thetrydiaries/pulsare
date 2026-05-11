import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

export default function BreathworkScreen() {
  const [experience, setExperience] = useState<'yes' | 'no' | null>(null);
  const [practice, setPractice] = useState('');
  const [userLabel, setUserLabel] = useState('');

  function handleNext() {
    if (!experience) return;
    storage.set('onboarding.breathworkExperience', experience);
    if (experience === 'yes') {
      storage.set('onboarding.breathworkPractice', practice.trim() || '');
    }
    if (userLabel.trim()) {
      storage.set('onboarding.breathworkUserLabel', userLabel.trim());
    }
    setOnboardingLastScreen(6);
    router.push('/onboarding/evening');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={12} current={6} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            have you tried any breathwork before?
          </Text>

          <View style={styles.options}>
            {(['yes', 'no'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.tile, experience === opt && styles.tileSelected]}
                onPress={() => setExperience(opt)}
                accessibilityRole="radio"
                accessibilityState={{ selected: experience === opt }}
              >
                <Text
                  variant="body"
                  color={experience === opt ? Colors.tealText : Colors.textSecondary}
                >
                  {opt === 'yes' ? "yes, i know what i'm doing" : 'no — show me something simple'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {experience === 'no' && (
            <View style={styles.explainer}>
              <Text variant="body" color={Colors.textSecondary} style={styles.explainerText}>
                we'll use something called a physiological sigh. two short inhales through the nose, then one long exhale through the mouth. that's it. two minutes.
              </Text>
              <Text variant="body" color={Colors.textSecondary} style={styles.explainerText}>
                it's the fastest known way to activate your parasympathetic nervous system — faster than meditation, faster than walking. you'll be reminded once a day.
              </Text>
            </View>
          )}

          {experience === 'yes' && (
            <View style={styles.practiceBlock}>
              <Text variant="label" style={styles.practiceLabel}>
                what do you use? (optional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="your practice"
                placeholderTextColor={Colors.textTertiary}
                value={practice}
                onChangeText={setPractice}
                returnKeyType="next"
                accessibilityLabel="describe your breathwork practice"
              />
            </View>
          )}

          {experience !== null && (
            <View style={styles.labelBlock}>
              <Text variant="label" style={styles.labelHint}>
                what do you call this?
              </Text>
              <TextInput
                style={styles.labelInput}
                placeholder="nervous system reset"
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

        <Button label="next" onPress={handleNext} disabled={!experience} style={styles.button} />
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
  explainer: {
    gap: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  explainerText: { lineHeight: 24, fontSize: 14 },
  practiceBlock: { gap: 8 },
  practiceLabel: {},
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  labelBlock: { gap: 6 },
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
  button: { marginTop: 8 },
});
