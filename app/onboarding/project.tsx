import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

export default function ProjectScreen() {
  const [project, setProject] = useState(() => storage.getString('onboarding.project') ?? '');

  function handleNext() {
    if (project.trim()) {
      storage.set('onboarding.project', project.trim());
    }
    setOnboardingLastScreen(10);
    router.push('/onboarding/start-date');
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
          <PipIndicator total={13} current={10} />

          <View style={styles.content}>
            <View style={styles.badge}>
              <Text variant="label" color={Colors.tealText}>coming in a few weeks</Text>
            </View>

            <Text variant="serif" size={26} style={styles.question}>
              when you're ready — around week four — we'll add one hour a day on one thing that matters to you.
            </Text>

            <Text variant="body" color={Colors.textSecondary} style={styles.sub}>
              what's something you've been meaning to build, write, or work on?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="a Substack, a side project, something creative, something that's been waiting"
              placeholderTextColor={Colors.textTertiary}
              value={project}
              onChangeText={setProject}
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleNext}
              accessibilityLabel="describe your project"
            />
          </View>

          <View style={styles.actions}>
            <Button label="next" onPress={handleNext} />
            {!project.trim() && (
              <Button
                label="skip for now"
                variant="ghost"
                onPress={handleNext}
                style={styles.skip}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { flex: 1, gap: 20, paddingVertical: 24 },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderColor: Colors.tealAction,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  question: { lineHeight: 36 },
  sub: { lineHeight: 24 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: { gap: 8, marginTop: 8 },
  skip: { opacity: 0.6 },
});
