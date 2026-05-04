import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';

const OPTIONS = [
  'running on empty',
  'holding it together, barely',
  "not great, but i'm ready to try something",
  "i've been here before — i know what i need",
];

export default function MoodScreen() {
  const name = storage.getString('onboarding.name') ?? 'you';
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    storage.set('onboarding.mood', selected);
    router.push('/onboarding/science');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <PipIndicator total={12} current={2} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            {name}, how are you doing — honestly?
          </Text>

          <View style={styles.options}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.tile,
                  selected === opt && styles.tileSelected,
                ]}
                onPress={() => setSelected(opt)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === opt }}
                accessibilityLabel={opt}
              >
                <Text
                  variant="body"
                  color={selected === opt ? Colors.tealText : Colors.textSecondary}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button label="next" onPress={handleNext} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
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
});
