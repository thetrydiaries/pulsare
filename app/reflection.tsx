import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { getReflection, setReflection, getLogEntry } from '@/lib/storage';
import { formatDate, logicalToday } from '@/lib/dayBoundary';

const REFLECTION_QUESTIONS = [
  'Did I show up more days than not?',
  'How does my body feel compared to last Sunday?',
  'What\'s one small thing I want to do differently this week?',
];

function getSundayKey(): string {
  const d = logicalToday();
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  return formatDate(d);
}

function isSunday(): boolean {
  return logicalToday().getDay() === 0;
}

function getWeekBodyWords(): string[] {
  const today = logicalToday();
  const dow = (today.getDay() + 6) % 7;
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

// Returns "X shows up most this week." or "seven different words this week."
// Returns null if fewer than 3 words logged or only shown on Sundays.
function getBodyWordPattern(words: string[]): string | null {
  if (!isSunday()) return null;
  const logged = words.filter((w) => w !== '—').map((w) => w.toLowerCase().trim());
  if (logged.length < 3) return null;
  const freq: Record<string, number> = {};
  const lastSeen: Record<string, number> = {};
  for (let i = 0; i < logged.length; i++) {
    const w = logged[i];
    freq[w] = (freq[w] ?? 0) + 1;
    lastSeen[w] = i;
  }
  const maxCount = Math.max(...Object.values(freq));
  if (maxCount < 2) return 'seven different words this week.';
  const topWords = Object.keys(freq).filter((w) => freq[w] === maxCount);
  const mode = topWords.sort((a, b) => lastSeen[b] - lastSeen[a])[0];
  return `${mode} shows up most this week.`;
}

export default function ReflectionScreen() {
  const sundayKey = getSundayKey();
  const questions = REFLECTION_QUESTIONS;
  const [answers, setAnswers] = useState<string[]>(() => {
    const existing = getReflection(sundayKey);
    return existing?.answers ?? Array(questions.length).fill('');
  });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyWords = getWeekBodyWords();
  const bodyWordPattern = getBodyWordPattern(bodyWords);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleAnswer(i: number, text: string) {
    const next = [...answers];
    next[i] = text;
    setAnswers(next);
    setReflection(sundayKey, { answers: next });
  }

  function handleSave() {
    setReflection(sundayKey, { answers });
    setSaved(true);
    saveTimer.current = setTimeout(() => {
      router.back();
    }, 600);
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

        {/* Body word pattern — Sundays only, ≥3 words */}
        {bodyWordPattern && (
          <Text
            variant="body"
            color={Colors.textSecondary}
            style={styles.bodyPattern}
          >
            {bodyWordPattern}
          </Text>
        )}

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

        <Button label={saved ? 'saved.' : 'save'} onPress={handleSave} style={styles.save} />
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
  bodyPattern: { fontStyle: 'italic', fontFamily: 'Outfit_300Light', lineHeight: 22 },
  questions: { gap: 24 },
  questionBlock: { gap: 10 },
  questionText: { lineHeight: 24 },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  save: { marginTop: 8 },
});
