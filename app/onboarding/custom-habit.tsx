import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';

export default function CustomHabitScreen() {
  const [habitName, setHabitName] = useState('');
  const [group, setGroup] = useState<'morning' | 'evening'>('morning');

  const hasName = habitName.trim().length > 0;

  function handleNext() {
    if (hasName) {
      storage.set('onboarding.customHabit.name', habitName.trim());
      storage.set('onboarding.customHabit.group', group);
    } else {
      storage.remove('onboarding.customHabit.name');
      storage.remove('onboarding.customHabit.group');
    }
    router.push('/onboarding/notifications');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PipIndicator total={13} current={8} />

          <View style={styles.content}>
            <Text variant="serif" size={26} style={styles.question}>
              is there something else you want to hold yourself to?
            </Text>
            <Text variant="label" color={Colors.textTertiary} style={styles.sub}>
              this is yours to define. it doesn't need to be big.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. no alcohol, call someone, get outside"
              placeholderTextColor={Colors.textTertiary}
              value={habitName}
              onChangeText={(t) => setHabitName(t.slice(0, 40))}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              accessibilityLabel="name your personal habit"
            />

            {hasName && (
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.pill, group === 'morning' && styles.pillSelected]}
                  onPress={() => setGroup('morning')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: group === 'morning' }}
                >
                  <Text
                    variant="label"
                    color={group === 'morning' ? Colors.tealText : Colors.textTertiary}
                  >
                    morning
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, group === 'evening' && styles.pillSelected]}
                  onPress={() => setGroup('evening')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: group === 'evening' }}
                >
                  <Text
                    variant="label"
                    color={group === 'evening' ? Colors.tealText : Colors.textTertiary}
                  >
                    evening
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Button
            label={hasName ? 'add it' : 'skip for now'}
            onPress={handleNext}
            variant={hasName ? undefined : 'ghost'}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { flex: 1, gap: 16, paddingVertical: 24 },
  question: { lineHeight: 36 },
  sub: { lineHeight: 20, fontSize: 13 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  pill: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  button: { marginTop: 8 },
});
