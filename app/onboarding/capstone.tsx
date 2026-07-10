import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

type Unit = 'kg' | 'lb';

// Free-form capstone. Type auto-inferred from goal text (weight verbs → weight
// type, everything else → other). User can still nudge structured fields on
// weight-flavour goals; otherwise they stay hidden and the goal string is the
// whole capstone.
function inferIsWeight(goal: string): boolean {
  const lower = goal.toLowerCase();
  return /(kg|lb|pound|weight|lose|gain|drop|body\s?fat|fat\s?loss|bmi)/.test(lower);
}

export default function CapstoneScreen() {
  const [goal, setGoal] = useState(() => storage.getString('onboarding.capstone.goal') ?? '');
  const [unit, setUnit] = useState<Unit>(
    (storage.getString('onboarding.capstone.unit') as Unit) ?? 'kg',
  );
  const [startValue, setStartValue] = useState(
    storage.getString('onboarding.capstone.startValue') ?? '',
  );
  const [targetValue, setTargetValue] = useState(
    storage.getString('onboarding.capstone.targetValue') ?? '',
  );

  const isWeightFlavour = inferIsWeight(goal);
  const isValid = !!goal.trim();

  function handleNext() {
    if (!isValid) return;
    storage.set('onboarding.capstone.goal', goal.trim());
    if (isWeightFlavour) {
      storage.set('onboarding.capstone.type', 'weight');
      storage.set('onboarding.capstone.unit', unit);
      if (startValue.trim()) storage.set('onboarding.capstone.startValue', startValue.trim());
      else storage.remove('onboarding.capstone.startValue');
      if (targetValue.trim()) storage.set('onboarding.capstone.targetValue', targetValue.trim());
      else storage.remove('onboarding.capstone.targetValue');
    } else {
      storage.set('onboarding.capstone.type', 'other');
      storage.remove('onboarding.capstone.unit');
      storage.remove('onboarding.capstone.startValue');
      storage.remove('onboarding.capstone.targetValue');
    }
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
            in a sentence. one big thing. keep it specific.
          </Text>

          <TextInput
            style={styles.goalInput}
            placeholder="e.g. lose 10kg · run a half marathon · write a book"
            placeholderTextColor={Colors.textTertiary}
            value={goal}
            onChangeText={setGoal}
            multiline
            returnKeyType="done"
            accessibilityLabel="describe your capstone"
          />

          {isWeightFlavour && (
            <View style={styles.weightBlock}>
              <Text variant="label" color={Colors.textTertiary} style={styles.weightHint}>
                because this looks weight-flavoured, adding numbers lets galaxy chart the trend. skip if you'd rather not track a number.
              </Text>
              <View style={styles.unitRow}>
                <TouchableOpacity
                  style={[styles.unitPill, unit === 'kg' && styles.unitPillSelected]}
                  onPress={() => setUnit('kg')}
                  accessibilityRole="button"
                >
                  <Text variant="label" color={unit === 'kg' ? Colors.tealText : Colors.textSecondary}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitPill, unit === 'lb' && styles.unitPillSelected]}
                  onPress={() => setUnit('lb')}
                  accessibilityRole="button"
                >
                  <Text variant="label" color={unit === 'lb' ? Colors.tealText : Colors.textSecondary}>lb</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.numberRow}>
                <View style={styles.numberField}>
                  <Text variant="label" style={styles.numberLabel}>start (optional)</Text>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="decimal-pad"
                    value={startValue}
                    onChangeText={setStartValue}
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    accessibilityLabel="starting weight"
                  />
                </View>
                <View style={styles.numberField}>
                  <Text variant="label" style={styles.numberLabel}>target (optional)</Text>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="decimal-pad"
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    accessibilityLabel="target weight"
                  />
                </View>
              </View>
            </View>
          )}

          <Text variant="label" style={styles.micro}>
            your capstone is the outcome. habits are the ladder to it. galaxy tracks both — presence keeps you consistent, capstone tells you if it's working.
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
  weightBlock: {
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  weightHint: { fontSize: 12, lineHeight: 18 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: 'center',
  },
  unitPillSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  numberRow: { flexDirection: 'row', gap: 12 },
  numberField: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  numberLabel: { fontSize: 11, color: Colors.textTertiary },
  numberInput: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 20,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
