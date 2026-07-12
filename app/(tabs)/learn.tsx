import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import BreathworkGuide from '@/components/BreathworkGuide';
import type { TechniqueKey } from '@/components/BreathworkGuide';
import { getUser, getPersonalisedCopy, storage } from '@/lib/storage';
import { getActiveHabits } from '@/lib/habits';
import { getLogicalDate, logicalToday, parseDate, daysSinceStart } from '@/lib/dayBoundary';
import { getConceptForCycle, getConceptByKey, CONCEPTS } from '@/lib/concepts';
import { getCycleDay } from '@/lib/cycle';
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
  'morning-light': {
    reframe: "light is the strongest circadian cue — stronger than any alarm or coffee",
    science:
      'the suprachiasmatic nucleus in your hypothalamus is set primarily by light hitting your retina in the first 30 minutes after waking. bright morning light suppresses melatonin cleanly, amplifies the cortisol awakening response, and shifts your body clock earlier — which sets up better sleep the following night. even overcast outdoor light is 10–100× brighter than indoor lighting.',
  },
  breakfast: {
    reframe: "eating early stabilises the whole day's chemistry",
    science:
      'a protein-forward breakfast within 90 minutes of waking supports blood-sugar stability and blunts the mid-morning cortisol overshoot. it also anchors leptin and ghrelin signalling, which regulates appetite for the rest of the day. skipping breakfast is fine biologically — but during weight-loss protocols, front-loading protein makes deficit far easier to hold.',
  },
  'calorie-log': {
    reframe: "you can't change what you don't see",
    science:
      "calorie tracking works less through math and more through awareness. studies consistently show that people who log their intake — even loosely — eat 20–30% less than those who don't, without conscious restriction. the act of logging bypasses habitual autopilot eating and reintroduces conscious choice at the moment it matters. the number isn't the point — the visibility is.",
  },
  'evening-journal': {
    reframe: 'three sentences. clear the buffer. then rest',
    science:
      'writing a short reflection before sleep reduces sleep-onset latency by an average of 9 minutes in randomised trials, primarily by externalising rumination. the effect is stronger for people with racing minds at night. adding a short read after — narrative fiction ideally — extends the wind-down without exposing you to screens, and further reduces cortisol.',
  },
  'phone-off-reading': {
    reframe: 'phone off is a nervous-system boundary, not a screen-time rule',
    science:
      'the second half of the evening is when melatonin should be rising. blue-spectrum light suppresses melatonin release; social-media stimuli spike dopamine and cortisol. shutting the phone off is less about hours of screen use and more about protecting the specific 90-minute window before sleep. narrative reading in that window has the opposite effect — it reduces both cortisol and heart rate.',
  },
  nsdr: {
    reframe: 'ten minutes flat on the floor restores what a bad night broke',
    science:
      'non-sleep deep rest (NSDR) is a directed, guided practice — sometimes called yoga nidra — that produces the brain-state effects of a nap without requiring sleep. it restores dopamine levels in the basal ganglia, reduces sympathetic arousal, and measurably improves next-hour focus. a 10-minute session in the mid-afternoon or early evening also reliably shortens sleep-onset latency at night. it is one of the highest-leverage rest interventions available.',
  },
};

// ─── Breathwork library spec ──────────────────────────────────────────────────

interface BreathTechCard {
  key: TechniqueKey;
  name: string;
  purpose: string;
  unlockLevel: number; // 1–3 — see getTechniqueLevel
}

const BREATH_TECHNIQUES: BreathTechCard[] = [
  { key: 'physiological-sigh', name: 'physiological sigh', purpose: 'acute reset. the fastest way to shift your nervous system.', unlockLevel: 1 },
  { key: 'cyclic-sigh', name: 'cyclic sighing', purpose: 'sustained vagus nerve activation. best after movement.', unlockLevel: 2 },
  { key: 'box-breathing', name: 'box breathing', purpose: 'prefrontal cortex on. best before focused work.', unlockLevel: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Breathwork techniques unlock across cycle 1 (~1/week); cycle 2+ has all three. */
function getTechniqueLevel(cycleNumber: number, cycleDay: number): number {
  if (cycleNumber > 1) return 3;
  if (cycleDay <= 7) return 1;
  if (cycleDay <= 14) return 2;
  return 3;
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
    'after my alarm, I get light within 10 minutes',
    'after light, I drink water — caffeine waits',
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
  techLevel: number;
  eveningHabitType?: string;
}

function HabitAccordionRow({ habit, isOpen, onToggle, onGuide, personalisedCopy, techLevel, eveningHabitType }: AccordionRowProps) {
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
  const unlockedTechniques = BREATH_TECHNIQUES.filter((t) => t.unlockLevel <= techLevel);
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
  const params = useLocalSearchParams<{ concept?: string }>();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [openHabitId, setOpenHabitId] = useState<string | null>(null);
  const [copy, setCopy] = useState(() => getPersonalisedCopy());
  const [libraryGuideVisible, setLibraryGuideVisible] = useState(false);
  const [libraryTechnique, setLibraryTechnique] = useState<TechniqueKey>('physiological-sigh');
  const [openConceptKey, setOpenConceptKey] = useState<string | null>(null);

  useEffect(() => {
    if (params.concept) {
      const c = getConceptByKey(params.concept);
      if (c) setOpenConceptKey(c.key);
    }
  }, [params.concept]);

  useFocusEffect(
    useCallback(() => {
      const u = getUser();
      setUser(u);
      if (u) setHabits(getActiveHabits());
      setCopy(getPersonalisedCopy());
    }, [])
  );

  // Poll while any custom habit is still waiting for AI-generated content
  useEffect(() => {
    const hasPending = habits.some((h) => h.isCustom && !h.learnContent && !h.personalReason);
    if (!hasPending || !user) return;
    const interval = setInterval(() => {
      const updated = getActiveHabits();
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

  const cycleNumber = user.cycleNumber ?? 1;
  const cycleDay = user.cycleStartDate ? getCycleDay(user.cycleStartDate) : 1;
  const techLevel = getTechniqueLevel(cycleNumber, cycleDay);
  const currentConceptKey =
    (params.concept && getConceptByKey(params.concept)?.key) ??
    getConceptForCycle(cycleNumber, cycleDay).key;
  const activeConceptKey = openConceptKey ?? currentConceptKey;
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
              techLevel={techLevel}
              eveningHabitType={user.eveningHabitType}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Section 2 — Concept library */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>the science</Text>
          <View style={styles.divider} />
          {CONCEPTS.map((c) => {
            const isOpen = activeConceptKey === c.key;
            const isCurrent = currentConceptKey === c.key;
            return (
              <View key={c.key} style={styles.conceptRow}>
                <TouchableOpacity
                  onPress={() => setOpenConceptKey(isOpen ? null : c.key)}
                  style={styles.conceptHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                >
                  <Text
                    variant="body"
                    color={isOpen ? Colors.tealText : Colors.textSecondary}
                    size={15}
                    style={styles.conceptRowTitle}
                  >
                    {c.title}
                  </Text>
                  {isCurrent && !isOpen && (
                    <Text variant="label" color={Colors.tealText} size={11}>this cycle</Text>
                  )}
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.conceptBody}>
                    <Text variant="label" color={Colors.textSecondary} style={styles.conceptDefinition}>
                      {c.definition}
                    </Text>
                    {c.body.split('\n\n').map((para, i) => (
                      <Text key={i} variant="label" color={Colors.textSecondary} style={styles.conceptPara}>
                        {para}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Section 3 — Anchoring stack (once habits established, ~day 15) */}
        {(cycleNumber > 1 || cycleDay >= 15) && (
          <View style={styles.section}>
            <Text variant="label" style={styles.sectionLabel}>your anchoring stack</Text>
            <View style={styles.divider} />
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
  conceptRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: 44,
  },
  conceptRowTitle: { flex: 1 },
  conceptBody: { gap: 12, paddingBottom: 16 },
  conceptDefinition: { lineHeight: 20 },
  conceptPara: { lineHeight: 22 },
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
