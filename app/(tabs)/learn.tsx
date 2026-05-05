import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getUser, getPersonalisedCopy } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import { getLogicalDate, parseDate, daysSinceStart } from '@/lib/dayBoundary';
import type { Habit, User } from '@/types';

// ─── Default habit learn content ─────────────────────────────────────────────

interface HabitLearnContent {
  reframe: string;
  science: string;
}

const HABIT_LEARN: Record<string, HabitLearnContent> = {
  'wake-anchor': {
    reframe: "this isn't about discipline — it's about giving your body a clock to trust",
    science:
      'your circadian rhythm governs cortisol, melatonin, body temperature, and mood. it synchronises to light and timing cues — your wake time is the strongest signal of all. consistency matters far more than the time itself. a regular anchor, even an imperfect one, builds a nervous system that knows when to be alert and when to wind down.',
  },
  'water-before-coffee': {
    reframe: 'hydration first is a small act with a disproportionate morning effect',
    science:
      'cortisol naturally peaks in the first 30–45 minutes after waking — a hormonal surge that primes alertness. caffeine on top of peak cortisol amplifies the spike and accelerates the crash. water before coffee lets the natural awakening response do its job first. it also rehydrates cells after 7–8 hours without fluid, which directly affects mood and cognition.',
  },
  'morning-movement': {
    reframe: "this isn't a workout — it's a signal",
    science:
      'low-intensity morning movement resets cortisol rhythm and signals to your nervous system that the day is safe to begin. it elevates BDNF (brain-derived neurotrophic factor), which supports mood regulation and neuroplasticity. outdoors amplifies the effect via light exposure — the combination of movement and morning light is one of the most potent circadian anchors available.',
  },
  'nervous-system-reset': {
    reframe: 'the exhale is the off switch — two minutes is enough',
    science:
      'extended exhalation activates the vagus nerve, which is the primary pathway of the parasympathetic nervous system. this shifts your body from sympathetic (threat-response) to parasympathetic (rest-and-digest) dominance. even two minutes of slow, extended exhales measurably lowers heart rate and cortisol. this is not relaxation — it is direct nervous system regulation.',
  },
  'consistent-bedtime': {
    reframe: 'your sleep window shapes your whole next day before it starts',
    science:
      'sleep quality depends not just on duration but on alignment with your circadian rhythm. your body begins preparing for sleep hours before you lie down — temperature drops, melatonin rises, and cortisol falls. a consistent bedtime trains these systems to fire predictably. irregular sleep, even if long, keeps your nervous system in a state of low-grade dysregulation.',
  },
  'evening-anchor': {
    reframe: 'a consistent ending signal matters as much as a consistent beginning',
    science:
      'your nervous system uses environmental and behavioural cues to transition between states. a predictable evening routine — the same activity at roughly the same time — becomes a conditioned signal that the threat-window of the day is closing. this reduces evening cortisol and supports melatonin onset. the specific activity matters less than its consistency.',
  },
};

// ─── Weekly concept library ───────────────────────────────────────────────────

interface WeeklyConcept {
  title: string;
  definition: string;
  body: string;
}

const WEEKLY_CONCEPTS: WeeklyConcept[] = [
  {
    title: 'circadian rhythm',
    definition: "your body's internal clock, synchronised by light, temperature, and timing cues.",
    body: `you've just set a wake anchor. here's why that matters so much more than it might seem.\n\nyour circadian rhythm is a roughly 24-hour biological cycle that governs almost everything — when cortisol rises, when melatonin is released, when your body temperature peaks, when your immune system is most active, and when your brain is best suited to focus or to rest.\n\nit doesn't run on a precise schedule by itself. it synchronises. the primary signal is light — specifically morning light hitting your retina. the secondary signal is timing: when you wake, when you eat, when you move. your wake anchor is training this system.\n\nthe research on consistency is unambiguous: a regular wake time is more powerful than any other sleep intervention. not because mornings are sacred, but because the body needs predictability to regulate itself. you are giving your nervous system something to sync to.`,
  },
  {
    title: 'the cortisol awakening response',
    definition: 'a natural surge in cortisol in the 30–45 minutes after waking, designed to prime alertness.',
    body: `you've been doing water before coffee and morning movement for a week. this is what's actually happening.\n\ncortisol is often described as a stress hormone, which is accurate but incomplete. it is also the hormone of alertness, motivation, and immune function. every morning, in a healthy circadian rhythm, it spikes sharply in the 30–45 minutes after waking. this is the cortisol awakening response, and it's supposed to happen.\n\nthe problem occurs when we interfere with it — caffeine on an empty, dehydrated system amplifies the spike and accelerates the crash. screens and social media add psychological activation on top of a system that's already revving.\n\nwhat you're building instead: water rehydrates your cells before cortisol demands them. movement extends and smooths the awakening curve. by the time you reach for coffee, your system has done its own work first. the day starts from a steadier baseline.`,
  },
  {
    title: 'neuroplasticity',
    definition: "the brain's ability to change its structure and function in response to repeated experience.",
    body: `three weeks. you've literally been building something.\n\nneuroplasticity is not a metaphor. repeated behaviours — especially those tied to circadian rhythms and stress regulation — measurably change the physical structure of your brain. synaptic connections strengthen with use. networks that fire together wire together. this happens at every age.\n\nwhat makes the habits you've been building particularly potent is that they target the systems that regulate neuroplasticity itself. sleep consolidates learning. BDNF from morning movement promotes the growth of new neural connections. cortisol regulation protects the prefrontal cortex, which is the part of your brain most responsible for executive function — the part most affected by burnout.\n\nyou are not just feeling better. you are building a different brain. it takes longer than three weeks to see the full effect, but the structural changes begin almost immediately. you've already started.`,
  },
];

function getWeekNumber(startDate: string): number {
  return Math.max(1, Math.ceil(daysSinceStart(startDate) / 7));
}

function getDaysUntilNextMonday(): number {
  const dow = new Date().getDay();
  return dow === 1 ? 7 : (8 - dow) % 7;
}

// ─── Accordion row ────────────────────────────────────────────────────────────

interface AccordionRowProps {
  habit: Habit;
  isOpen: boolean;
  onToggle: (id: string) => void;
  personalisedCopy: ReturnType<typeof getPersonalisedCopy>;
}

function HabitAccordionRow({ habit, isOpen, onToggle, personalisedCopy }: AccordionRowProps) {
  const fadeAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, fadeAnim]);

  const suggestedId = habit.suggestedId ?? '';
  const builtInContent = HABIT_LEARN[suggestedId] ?? null;
  const content = builtInContent ?? habit.learnContent ?? null;
  const personalisedReframe = personalisedCopy?.habitExplanations?.[suggestedId];

  const displayLabel = habit.userLabel ?? habit.label;

  return (
    <View style={accordionStyles.row}>
      <TouchableOpacity
        onPress={() => onToggle(habit.id)}
        style={accordionStyles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${displayLabel}, ${isOpen ? 'collapse' : 'expand'}`}
        activeOpacity={0.7}
      >
        <Text variant="body" color={Colors.textSecondary} size={15}>
          {displayLabel}
        </Text>
      </TouchableOpacity>

      {isOpen && content && (
        <Animated.View style={[accordionStyles.expanded, { opacity: fadeAnim }]}>
          <Text variant="body" color={Colors.textSecondary} size={14} style={accordionStyles.reframe}>
            {personalisedReframe ?? content.reframe}
          </Text>
          <Text variant="label" color={Colors.textTertiary} style={accordionStyles.science}>
            {content.science}
          </Text>
        </Animated.View>
      )}

      {isOpen && !content && habit.isCustom && (
        <Animated.View style={[accordionStyles.expanded, { opacity: fadeAnim }]}>
          <Text variant="label" color={Colors.textTertiary} style={accordionStyles.science}>
            preparing your explainer...
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [openHabitId, setOpenHabitId] = useState<string | null>(null);
  const [copy, setCopy] = useState(() => getPersonalisedCopy());

  useFocusEffect(
    useCallback(() => {
      const u = getUser();
      setUser(u);
      if (u) setHabits(getActiveHabits(u.currentPhase));
      setCopy(getPersonalisedCopy());
    }, [])
  );

  // Poll while any custom habit is still waiting for AI-generated content
  useEffect(() => {
    const hasPending = habits.some((h) => h.isCustom && !h.learnContent);
    if (!hasPending || !user) return;
    const interval = setInterval(() => {
      const updated = getActiveHabits(user.currentPhase);
      setHabits(updated);
      if (!updated.some((h) => h.isCustom && !h.learnContent)) {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [habits, user]);

  function handleToggle(id: string) {
    setOpenHabitId((prev) => (prev === id ? null : id));
  }

  if (!user) return null;

  const weekNum = getWeekNumber(user.startDate);
  const conceptIndex = Math.min(weekNum - 1, WEEKLY_CONCEPTS.length - 1);
  const concept = WEEKLY_CONCEPTS[conceptIndex];
  const daysUntilNext = getDaysUntilNextMonday();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="serifItalic" size={32} style={styles.heading}>learn</Text>

        {/* Section 1 — Your habits */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>your habits</Text>
          <View style={styles.divider} />
          {habits.map((h) => (
            <HabitAccordionRow
              key={h.id}
              habit={h}
              isOpen={openHabitId === h.id}
              onToggle={handleToggle}
              personalisedCopy={copy}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Section 2 — This week */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>this week</Text>
          <View style={styles.conceptCard}>
            <Text variant="serif" size={22} style={styles.conceptTitle}>{concept.title}</Text>
            <Text variant="label" color={Colors.textSecondary} style={styles.conceptDefinition}>
              {concept.definition}
            </Text>
            {concept.body.split('\n\n').map((para, i) => (
              <Text key={i} variant="label" color={Colors.textSecondary} style={styles.conceptPara}>
                {para}
              </Text>
            ))}
            <Text variant="label" color={Colors.textTertiary} style={styles.nextConcept}>
              new concept in {daysUntilNext} {daysUntilNext === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48, gap: 8 },
  heading: { marginBottom: 16 },
  section: { gap: 8 },
  sectionLabel: { letterSpacing: 0.8, marginBottom: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  conceptCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  conceptTitle: { lineHeight: 30 },
  conceptDefinition: { lineHeight: 20 },
  conceptPara: { lineHeight: 22 },
  nextConcept: { marginTop: 4 },
});

const accordionStyles = StyleSheet.create({
  row: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  header: {
    paddingVertical: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  expanded: {
    paddingBottom: 16,
    gap: 10,
  },
  reframe: {
    lineHeight: 20,
  },
  science: {
    lineHeight: 20,
    fontSize: 13,
  },
});
