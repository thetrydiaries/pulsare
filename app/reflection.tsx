import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { getUser, getReflection, setReflection, getAllLogDates, getLogEntry } from '@/lib/storage';
import { getLogicalDate, dateRangeFromStart, formatDate } from '@/lib/dayBoundary';

const PHASE1_QUESTIONS = [
  'Did I show up more days than not?',
  'How does my body feel compared to last Sunday?',
  'What\'s one small thing I want to do differently this week?',
];

function getSundayKey(): string {
  const d = new Date();
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  return formatDate(d);
}

function getWeekBodyWords(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);
    const entry = getLogEntry(dateStr);
    return entry?.bodyCheckWord ?? '—';
  });
}

export default function ReflectionScreen() {
  const user = getUser();
  const sundayKey = getSundayKey();
  const questions = PHASE1_QUESTIONS; // Phase 1 only for Build Phase 1
  const [answers, setAnswers] = useState<string[]>(() => {
    const saved = getReflection(sundayKey);
    return saved?.answers ?? Array(questions.length).fill('');
  });
  const bodyWords = getWeekBodyWords();

  function handleAnswer(i: number, text: string) {
    const next = [...answers];
    next[i] = text;
    setAnswers(next);
  }

  function handleSave() {
    setReflection(sundayKey, { answers });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="go back"
        >
          <Text variant="label" color={Colors.tealText}>← back</Text>
        </TouchableOpacity>

        <Text variant="serif" size={26} style={styles.title}>weekly reflection</Text>
        <Text variant="label" style={styles.date}>{sundayKey}</Text>

        {/* Body words */}
        <View style={styles.bodyBlock}>
          <Text variant="label" style={styles.bodyIntro}>this is how you described yourself each morning:</Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.bodyWords}>
            {bodyWords.join(' · ')}
          </Text>
        </View>

        {/* Questions */}
        <View style={styles.questions}>
          {questions.map((q, i) => (
            <View key={i} style={styles.questionBlock}>
              <Text variant="body" style={styles.questionText}>{q}</Text>
              <TextInput
                style={styles.input}
                value={answers[i]}
                onChangeText={(t) => handleAnswer(i, t)}
                placeholder="..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                returnKeyType="default"
                accessibilityLabel={q}
              />
            </View>
          ))}
        </View>

        <Button label="save" onPress={handleSave} style={styles.save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48, gap: 20 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  title: { lineHeight: 36 },
  date: { marginTop: -12 },
  bodyBlock: {
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  bodyIntro: { lineHeight: 18 },
  bodyWords: { lineHeight: 24, fontSize: 14 },
  questions: { gap: 24 },
  questionBlock: { gap: 10 },
  questionText: { lineHeight: 24 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  save: { marginTop: 8 },
});
