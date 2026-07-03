import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

const MOOD_OPTIONS = [
  'running on empty',
  'holding it together, barely',
  "not great, but i'm ready to try something",
  "i've been here before — i know what i need",
];

export default function WelcomeScreen() {
  const [mood, setMood] = useState<string | null>(() => storage.getString('onboarding.mood') ?? null);

  function handleBegin() {
    if (mood) storage.set('onboarding.mood', mood);
    setOnboardingLastScreen(0);
    router.push('/onboarding/name');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PipIndicator total={7} current={0} />

        <View style={styles.content}>
          <View style={styles.headlineBlock}>
            <Text variant="serif" size={34} style={styles.headline}>
              you're here.
            </Text>
            <Text variant="serifItalic" size={34} style={styles.sub}>
              that's already something.
            </Text>
          </View>

          <Text variant="body" color={Colors.textSecondary} style={styles.ethos}>
            pulsare rebuilds your nervous system slowly — small signals, every day. we add gently, and we never punish a missed day.
          </Text>

          <View style={styles.moodBlock}>
            <Text variant="label" color={Colors.textTertiary} style={styles.moodPrompt}>
              before we start — how are you, honestly?
            </Text>
            <View
              style={styles.options}
              accessibilityRole="radiogroup"
              accessibilityLabel="how are you, honestly?"
            >
              {MOOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.tile, mood === opt && styles.tileSelected]}
                  onPress={() => setMood(mood === opt ? null : opt)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mood === opt }}
                  accessibilityLabel={opt}
                >
                  <Text
                    variant="body"
                    color={mood === opt ? Colors.tealText : Colors.textSecondary}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button label="let's begin" onPress={handleBegin} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 24,
  },
  headlineBlock: { gap: 4 },
  headline: { lineHeight: 44 },
  sub: { lineHeight: 44, color: Colors.textSecondary },
  ethos: { lineHeight: 24 },
  moodBlock: { gap: 12 },
  moodPrompt: { letterSpacing: 0.6, lineHeight: 20 },
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
  button: { marginTop: 16 },
});
