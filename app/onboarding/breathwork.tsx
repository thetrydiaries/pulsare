import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';

export default function BreathworkScreen() {
  const [experience, setExperience] = useState<'yes' | 'no' | null>(null);
  const [practice, setPractice] = useState('');

  function handleNext() {
    if (!experience) return;
    storage.set('onboarding.breathworkExperience', experience);
    if (experience === 'yes') {
      storage.set('onboarding.breathworkPractice', practice.trim() || '');
    }
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
            Have you tried any breathwork before?
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
                  {opt === 'yes' ? 'Yes, I know what I\'m doing' : 'No — show me something simple'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {experience === 'no' && (
            <View style={styles.explainer}>
              <Text variant="body" color={Colors.textSecondary} style={styles.explainerText}>
                We'll use something called a physiological sigh. Two short inhales through the nose, then one long exhale through the mouth. That's it. Two minutes.
              </Text>
              <Text variant="body" color={Colors.textSecondary} style={styles.explainerText}>
                It's the fastest known way to activate your parasympathetic nervous system — faster than meditation, faster than walking. You'll be reminded once a day.
              </Text>
            </View>
          )}

          {experience === 'yes' && (
            <View style={styles.practiceBlock}>
              <Text variant="label" style={styles.practiceLabel}>
                What do you use? (optional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="your practice"
                placeholderTextColor={Colors.textTertiary}
                value={practice}
                onChangeText={setPractice}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="describe your breathwork practice"
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
  button: { marginTop: 8 },
});
