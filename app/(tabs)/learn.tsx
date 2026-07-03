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
import BreathworkGuide from '@/components/BreathworkGuide';
import type { TechniqueKey } from '@/components/BreathworkGuide';
import { getUser, getPersonalisedCopy, storage } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import { getLogicalDate, logicalToday, parseDate, daysSinceStart } from '@/lib/dayBoundary';
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

// ─── Weekly concept library (presence / timing / stacking) ───────────────────

interface WeeklyConcept {
  title: string;
  definition: string;
  body: string;
}

const WEEKLY_CONCEPTS: WeeklyConcept[] = [
  {
    title: 'presence',
    definition: "showing up consistently — even imperfectly — is the signal your nervous system needs most.",
    body: `The nervous system doesn't respond to effort — it responds to patterns. What you're building this week isn't a set of habits. It's a signal. Every time you wake at the same time, drink water before coffee, move your body, and breathe intentionally, you're sending a low-level message to your HPA axis: the day is predictable. Safety is the precondition for regulation.\n\nPresence means you showed up. Not that you did it perfectly, or for the full duration, or at the exact right time. A 10-minute walk at 11am counts. Breathwork in the car counts. The nervous system doesn't grade on effort — it tracks repetition.\n\nThis is also why the never-miss-twice rule is structural, not motivational. One missed day is noise. Two consecutive missed days is a pattern. The system is designed to make the second miss nearly impossible — not through guilt, but through design.\n\nThis week: just do the things. Don't think about doing them well. The precision comes in week 2.`,
  },
  {
    title: 'timing',
    definition: "your nervous system runs on a 24-hour clock — and when you do things matters as much as whether you do them.",
    body: `Your circadian rhythm is governed by the suprachiasmatic nucleus (SCN) — a cluster of about 20,000 neurons in your hypothalamus that acts as your master body clock. It regulates cortisol, melatonin, body temperature, appetite, and mood across a 24-hour cycle. The SCN is primarily set by light, but it's reinforced by behavioural anchors — which is exactly what you've been building.\n\nHere's what's happening in your morning window right now. Cortisol peaks naturally in the 30–45 minutes after waking — this is called the cortisol awakening response (CAR). It's your body's own alarm system: a burst of energy and alertness designed to prepare you for the day. Caffeine on top of that spike builds tolerance fast and blunts the CAR over time. Morning light within 30 minutes of waking amplifies it. Movement 45–60 minutes in hits the peak window for BDNF — the protein that drives neuroplasticity. You've been doing all of this. This week you'll start to understand why the sequence matters.\n\nThe anchors you've been building aren't arbitrary. They're timed to your body's own chemistry. Wake at the same time → cortisol rises on schedule. Light within 30 minutes → melatonin suppresses cleanly. Movement at 45–60 minutes → BDNF peaks. Water before coffee → cortisol spike stays regulated. Each one feeds the next. This is why the order matters, and why the order in which your habits appear on the home screen reflects the sequence — not just a list.\n\nThis week: do the habits in order. Don't rush through them. The gap between waking and coffee is as important as the coffee itself.`,
  },
  {
    title: 'stacking',
    definition: "linking habits to existing cues pre-loads the behaviour into memory — so the decision gets made once, not every morning.",
    body: `Implementation intentions are one of the most replicated findings in behavioural psychology. The research is simple: people who form an explicit if-then plan — "after I wake up, I will go directly to the kitchen and drink water before touching my phone" — follow through at two to three times the rate of people who just intend to do the habit. The mechanism isn't motivational. It's neurological. The if-then plan pre-loads the behaviour into working memory, so when the cue fires, the routine activates automatically — without requiring deliberate prefrontal cortex decision-making.\n\nThis matters enormously for executive dysfunction. The prefrontal cortex — the part of the brain responsible for initiation, planning, and follow-through — is the exact system that's impaired. Every time a habit requires a new decision to start, you're asking the PFC to do something it's currently struggling with. Habit stacking bypasses that. The cue does the initiating. The PFC just follows.\n\nYou've been building the habits. This week you're building the architecture that makes them automatic. The if-then stacks in your protocol are already written — you can find them in your anchoring stack below. Read them. Say them out loud if that helps. The research suggests that the act of forming the plan, not just reading it, is what encodes it.\n\nBy the end of this week, the morning sequence shouldn't feel like a list of things to remember. It should feel like one thing that unfolds from the first cue.`,
  },
];

// ─── Breathwork library spec ──────────────────────────────────────────────────

interface BreathTechCard {
  key: TechniqueKey;
  name: string;
  purpose: string;
  minWeek: number;
}

const BREATH_TECHNIQUES: BreathTechCard[] = [
  { key: 'physiological-sigh', name: 'physiological sigh', purpose: 'acute reset. the fastest way to shift your nervous system.', minWeek: 1 },
  { key: 'cyclic-sigh', name: 'cyclic sighing', purpose: 'sustained vagus nerve activation. best after movement.', minWeek: 2 },
  { key: 'box-breathing', name: 'box breathing', purpose: 'prefrontal cortex on. best before focused work.', minWeek: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekNumber(startDate: string): number {
  return Math.max(1, Math.ceil(daysSinceStart(startDate) / 7));
}

function getDaysUntilNextMonday(): number {
  const dow = logicalToday().getDay();
  return dow === 1 ? 7 : (8 - dow) % 7;
}

function getAnchoringStackStatements(): string[] {
  const movement = storage.getString('onboarding.movement') ?? 'morning movement';
  const eveningLabel = storage.getString('onboarding.eveningHabitLabel') ?? 'my evening habit';
  const windDown = storage.getString('onboarding.notif.windDown') ?? '21:30';
  const [h, m] = windDown.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = h % 12 === 0 ? 12 : h % 12;
  const windDownDisplay = `${dh}:${m.toString().padStart(2, '0')}${ampm}`;

  return [
    'after my alarm, I go straight to morning light',
    'after morning light, I drink water before coffee',
    `after water, I go for my ${movement}`,
    `after my walk, I do the sigh`,
    `at ${windDownDisplay}, I start ${eveningLabel}`,
  ];
}

// ─── Accordion row ────────────────────────────────────────────────────────────

interface AccordionRowProps {
  habit: Habit;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onGuide?: (technique: TechniqueKey) => void;
  personalisedCopy: ReturnType<typeof getPersonalisedCopy>;
  weekNum: number;
  eveningHabitType?: string;
}

function HabitAccordionRow({ habit, isOpen, onToggle, onGuide, personalisedCopy, weekNum, eveningHabitType }: AccordionRowProps) {
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
  const isBreathwork = suggestedId === 'nervous-system-reset';
  const hasPersonalReason = habit.isCustom && !!habit.personalReason;

  const displayLabel = habit.userLabel ?? habit.label;

  // Breathwork library — techniques unlocked so far
  const unlockedTechniques = BREATH_TECHNIQUES.filter((t) => t.minWeek <= weekNum);
  const hasEveningBreathwork = eveningHabitType === 'breathwork';

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

      {isOpen && (content || hasPersonalReason) && (
        <Animated.View style={[accordionStyles.expanded, { opacity: fadeAnim }]}>
          {/* Personal reason for custom habits */}
          {hasPersonalReason && (
            <Text variant="body" color={Colors.textSecondary} size={14} style={accordionStyles.reframe}>
              {habit.personalReason}
            </Text>
          )}
          {/* Built-in or AI content */}
          {content && (
            <>
              <Text variant="body" color={Colors.textSecondary} size={14} style={accordionStyles.reframe}>
                {personalisedReframe ?? content.reframe}
              </Text>
              <Text variant="label" color={Colors.textTertiary} style={accordionStyles.science}>
                {content.science}
              </Text>
            </>
          )}

          {/* Breathwork library */}
          {isBreathwork && unlockedTechniques.length > 0 && (
            <View style={accordionStyles.librarySection}>
              <Text variant="bodySemibold" color={Colors.textSecondary} style={accordionStyles.libraryHeading}>
                breathwork library
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={accordionStyles.libraryRow}>
                {unlockedTechniques.map((tech) => (
                  <View key={tech.key} style={accordionStyles.techCard}>
                    <Text variant="body" color={Colors.textPrimary} size={13}>{tech.name}</Text>
                    <Text variant="label" color={Colors.textTertiary} style={accordionStyles.techPurpose}>{tech.purpose}</Text>
                    <TouchableOpacity
                      onPress={() => onGuide?.(tech.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`try ${tech.name}`}
                    >
                      <Text variant="label" color={Colors.tealText} style={accordionStyles.tryIt}>try it →</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {/* 4-7-8 locked card for non-evening-breathwork users */}
                {!hasEveningBreathwork && (
                  <View style={[accordionStyles.techCard, accordionStyles.techCardLocked]}>
                    <Text variant="body" color={Colors.textTertiary} size={13}>4-7-8 · sleep onset</Text>
                    <Text variant="label" color={Colors.textTertiary} style={accordionStyles.techPurpose}>
                      unlocks as your evening breathwork practice.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {isOpen && !content && !hasPersonalReason && habit.isCustom && (
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
  const [libraryGuideVisible, setLibraryGuideVisible] = useState(false);
  const [libraryTechnique, setLibraryTechnique] = useState<TechniqueKey>('physiological-sigh');

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
    const hasPending = habits.some((h) => h.isCustom && !h.learnContent && !h.personalReason);
    if (!hasPending || !user) return;
    const interval = setInterval(() => {
      const updated = getActiveHabits(user.currentPhase);
      setHabits(updated);
      if (!updated.some((h) => h.isCustom && !h.learnContent && !h.personalReason)) {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [habits, user]);

  function handleToggle(id: string) {
    setOpenHabitId((prev) => (prev === id ? null : id));
  }

  function handleLibraryGuide(technique: TechniqueKey) {
    setLibraryTechnique(technique);
    setLibraryGuideVisible(true);
  }

  if (!user) return null;

  const weekNum = getWeekNumber(user.startDate);
  const conceptIndex = Math.min(weekNum - 1, WEEKLY_CONCEPTS.length - 1);
  const concept = WEEKLY_CONCEPTS[conceptIndex];
  const daysUntilNext = getDaysUntilNextMonday();
  const anchoringStack = getAnchoringStackStatements();

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
              onGuide={handleLibraryGuide}
              personalisedCopy={copy}
              weekNum={weekNum}
              eveningHabitType={user.eveningHabitType}
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

            {/* Week 3: anchoring stack pills */}
            {weekNum >= 3 && (
              <View style={styles.stackSection}>
                <Text variant="bodySemibold" color={Colors.textSecondary} style={styles.stackHeading}>
                  your anchoring stack
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stackRow}
                >
                  {anchoringStack.map((stmt, i) => (
                    <View key={i} style={styles.stackPill}>
                      <Text variant="label" color={Colors.textTertiary} size={13}>
                        {stmt}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text variant="label" color={Colors.textTertiary} style={styles.nextConcept}>
              new concept in {daysUntilNext} {daysUntilNext === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Breathwork guide — from library "try it" links, no habit completion */}
      <BreathworkGuide
        visible={libraryGuideVisible}
        technique={libraryTechnique}
        onDismiss={() => setLibraryGuideVisible(false)}
      />
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
  stackSection: {
    marginTop: 8,
    gap: 10,
  },
  stackHeading: {
    fontSize: 14,
  },
  stackRow: {
    gap: 8,
    paddingVertical: 4,
  },
  stackPill: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#1c1c1c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
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
  librarySection: {
    marginTop: 4,
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  libraryHeading: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  libraryRow: {
    gap: 10,
    paddingBottom: 4,
  },
  techCard: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    width: 180,
    gap: 6,
  },
  techCardLocked: {
    borderColor: Colors.tealAction,
    opacity: 0.6,
  },
  techPurpose: {
    lineHeight: 18,
    fontSize: 12,
  },
  tryIt: {
    fontSize: 12,
    marginTop: 4,
  },
});
