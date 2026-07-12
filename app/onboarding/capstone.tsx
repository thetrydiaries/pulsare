import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

// North star: one free-text line, no numbers, no tracking. It's a bearing —
// the anchors are the daily work; this is just the why they point toward.
export default function CapstoneScreen() {
  const [goal, setGoal] = useState(() => storage.getString('onboarding.capstone.goal') ?? '');

  const isValid = !!goal.trim();

  function handleNext() {
    if (!isValid) return;
    storage.set('onboarding.capstone.goal', goal.trim());
    // Clean any legacy structured fields from an earlier pass through this screen.
    storage.remove('onboarding.capstone.type');
    storage.remove('onboarding.capstone.unit');
    storage.remove('onboarding.capstone.startValue');
    storage.remove('onboarding.capstone.targetValue');
    setOnboardingLastScreen(3);
    router.push('/onboarding/habits');
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
            what are you building toward?
          </Text>
          <Text variant="label" style={styles.subtitle}>
            your north star for this season. the one thing these anchors point toward.
          </Text>

          <TextInput
            style={styles.goalInput}
            placeholder="e.g. feel at home in my body · run a half marathon · write a book"
            placeholderTextColor={Colors.textTertiary}
            value={goal}
            onChangeText={setGoal}
            multiline
            returnKeyType="done"
            accessibilityLabel="describe your north star"
          />

          <Text variant="label" style={styles.micro}>
            your north star is the direction. the anchors are the daily work that points there. we track presence — showing up is the whole job. the north star just tells you why.
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
  content: { gap: 20, paddingVertical: 24 },
  question: { lineHeight: 36 },
  subtitle: { color: Colors.textTertiary, fontSize: 13, letterSpacing: 0.4, marginTop: -8, lineHeight: 18 },
  goalInput: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
