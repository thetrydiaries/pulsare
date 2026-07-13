// Shared concept library — used by galaxy card (short) and learn tab (full body).
// Single source of truth so galaxy → learn deep-link lands on matching content.

export interface Concept {
  key: string;
  title: string;
  definition: string;
  body: string;
}

export const CONCEPTS: Concept[] = [
  {
    key: 'circadian-rhythm',
    title: 'circadian rhythm',
    definition:
      'your body runs on a 24-hour internal clock that governs cortisol, mood, energy, and sleep — and consistency matters more than the time you choose.',
    body: `Your circadian rhythm is governed by the suprachiasmatic nucleus (SCN) — a cluster of about 20,000 neurons in your hypothalamus that acts as your master body clock. It regulates cortisol, melatonin, body temperature, appetite, and mood across a 24-hour cycle. The SCN is primarily set by light, but it's reinforced by behavioural anchors — which is exactly what you've been building.\n\nThe time you wake matters less than the fact that you wake at the same time. Regularity is the signal. A body that knows when to be alert also knows when to wind down.`,
  },
  {
    key: 'cortisol-awakening',
    title: 'the cortisol awakening response',
    definition:
      'in the 30–45 minutes after waking, cortisol spikes naturally to prepare you for the day — what you do in that window either amplifies the spike or steadies it.',
    body: `Cortisol peaks naturally in the 30–45 minutes after waking. This is called the cortisol awakening response (CAR). It's your body's own alarm system: a burst of energy and alertness designed to prepare you for the day.\n\nCaffeine on top of that spike builds tolerance fast and blunts the CAR over time. Morning light within 30 minutes of waking amplifies it. Movement 45–60 minutes in hits the peak window for BDNF — the protein that drives neuroplasticity. Water before coffee lets the natural awakening response do its job first.`,
  },
  {
    key: 'phase-1-vs-phase-2',
    title: 'phase 1 vs phase 2',
    definition:
      'the first 8 hours after waking are your action window. the next 6 are your wind-down. matching habits to phase makes them 10x easier.',
    body: `Your day splits into phases set by your body's neurochemistry. Phase 1 is the first 0–8 hours after waking. Elevated cortisol, norepinephrine, and dopamine make this the window for hard habits — the ones that need willpower to start. Movement. Cold exposure. Focused work. The chemistry is on your side.\n\nPhase 2 is 9–15 hours after waking. Serotonin rises. Stress tapers. This is the window for low-friction habits — journaling, reading, reflection, wind-down. Habits that don't need willpower to start.\n\nStacking hard habits in phase 1 and soft ones in phase 2 is the difference between a protocol that runs on chemistry and one that runs on effort you don't have.`,
  },
  {
    key: 'task-bracketing',
    title: 'task bracketing',
    definition:
      'linking a habit to the cue that comes before it and the moment that comes after pre-loads the behaviour so the decision gets made once, not every day.',
    body: `Implementation intentions are one of the most replicated findings in behavioural psychology. People who form an explicit if-then plan — "after I wake up, I will go directly to the kitchen and drink water before touching my phone" — follow through at two to three times the rate of people who just intend to do the habit.\n\nThe mechanism isn't motivational. It's neurological. The if-then plan pre-loads the behaviour into working memory, so when the cue fires, the routine activates automatically — without requiring deliberate prefrontal cortex decision-making.\n\nFor executive dysfunction, this is everything. Every time a habit requires a new decision to start, you're asking the PFC to do something it's currently struggling with. Task bracketing bypasses that. The cue does the initiating. The PFC just follows.`,
  },
  {
    key: 'four-of-six-rule',
    title: 'the rule of 4',
    definition:
      "you're not meant to hit every habit every day. four is present, whatever your total. a day where you did enough is a day that counts.",
    body: `However many habits you picked, the target is four. Hitting every one every day is a failure mode. It teaches your nervous system that anything less than perfect is a miss. Motivation collapses on day 8.\n\nFour is a present day. It's engineered slack — and it stays four even if you add habits, because adding habits should never raise the bar for showing up. Some days movement won't happen. Some days journal won't. The stack has enough redundancy that the pattern holds even when individual habits don't.\n\nThe hard rule isn't "hit them all." It's "never miss twice." One skipped day is noise. Two consecutive skipped days is a pattern. The system is designed to make the second miss nearly impossible — not through guilt, but through design.`,
  },
  {
    key: 'twenty-one-day-cycle',
    title: 'the 21-day cycle',
    definition:
      "21 days isn't when a habit is 'formed' — it's when you stop tracking and see what stuck. that gap is the whole point.",
    body: `The research on habit formation is misquoted constantly. It doesn't take 21 days to form a habit. What it does take is roughly 21 days of consistent practice before the neural pathway is efficient enough that you can stop deliberately tracking and see what your nervous system holds on to on its own.\n\nAt day 21, the protocol changes. You stop actively engaging with your habits and observe which ones you naturally reach for. That's the signal. Anything that requires the tracker to remember is not yet automatic.\n\nAnything that runs without you thinking about it has moved from "protocol you follow" to "someone you're becoming." That's the transition worth waiting for.`,
  },
  {
    key: 'north-star-vs-habit',
    title: 'north star vs habit',
    definition:
      "your north star is the why. your habits are the daily work. don't confuse the two — the direction isn't a checkbox and the habits aren't the point.",
    body: `A north star is the direction you're building toward — a book written, a body you feel at home in, a business launched. It's the thing habits serve. It's not a habit itself, because it can't be done in a day, and it isn't a gauge — nothing about it gets measured or scored.\n\nHabits are the daily behaviours that point toward it. They're binary — did or didn't. They live inside a single day. The distinction matters because most people confuse the two, and it costs them everything.\n\nIf your north star is "get healthy" and your habit is "eat well," you'll stall. "Eat well" is direction-flavoured — it can't be checked. If your habit is "prep tomorrow's food before wind-down," you have something that lives inside a day, runs on chemistry, and quietly serves the north star over time.\n\nWe track presence — showing up is the whole job. The north star just tells you why you're showing up.`,
  },
  {
    key: 'never-miss-twice',
    title: 'never miss twice',
    definition:
      "a missed day doesn't delete the pathway — it just goes quiet. two in a row starts a new pattern. one is nothing. two is a signal.",
    body: `The nervous system doesn't grade individual days — it tracks patterns. One missed day is noise. Two consecutive missed days is the start of a new pattern: the pattern of stopping.\n\nThis is why the never-miss-twice rule is structural, not motivational. You don't need to justify a bad day. You need to make sure it doesn't become the second bad day.\n\nComing back after a lapse is always faster than starting from scratch, because the wiring is still there — it just went quiet. The pathway isn't deleted by a miss. It's deleted by a pattern.`,
  },
  {
    key: 'identity-based-habits',
    title: 'identity-based habits',
    definition:
      "the strongest habits aren't things you do, they're things you are. a month in, this stops being a protocol you follow and starts being someone you're becoming.",
    body: `Every habit you build starts as an action. You choose to do it. You track it. You decide, day by day, whether it happens.\n\nAt some point, that shifts. The habit stops being something you're doing and starts being something you are. You don't decide to drink water before coffee — you're a person who drinks water before coffee. You don't debate the morning walk — you're a person who walks in the morning.\n\nThis is the deepest form of habit change, and it's slower than the tracker suggests. Identity is downstream of repeated action. By the time you're a month in, the identity is quietly forming underneath — and by cycle two or three, the identity is doing the work the tracker used to.`,
  },
];

export function getConceptByKey(key: string): Concept | undefined {
  return CONCEPTS.find((c) => c.key === key);
}

// Concepts are paced by the 21-day cycle, not a parallel week counter.
// Cycle 1 unlocks the foundations (~2 per week across the 21 days); the
// deeper identity concepts land in cycle 2+.
const CYCLE_SCHEDULE: { cycle: number; day: number; key: string }[] = [
  { cycle: 1, day: 1, key: 'circadian-rhythm' },
  { cycle: 1, day: 4, key: 'cortisol-awakening' },
  { cycle: 1, day: 8, key: 'phase-1-vs-phase-2' },
  { cycle: 1, day: 11, key: 'task-bracketing' },
  { cycle: 1, day: 15, key: 'four-of-six-rule' },
  { cycle: 1, day: 18, key: 'twenty-one-day-cycle' },
  { cycle: 2, day: 1, key: 'north-star-vs-habit' },
  { cycle: 2, day: 8, key: 'never-miss-twice' },
  { cycle: 2, day: 15, key: 'identity-based-habits' },
];

/** The most recently unlocked concept for where she actually is in the cycle arc. */
export function getConceptForCycle(cycleNumber: number, cycleDay: number): Concept {
  let current = CYCLE_SCHEDULE[0];
  for (const entry of CYCLE_SCHEDULE) {
    if (cycleNumber > entry.cycle || (cycleNumber === entry.cycle && cycleDay >= entry.day)) {
      current = entry;
    }
  }
  return CONCEPTS.find((c) => c.key === current.key)!;
}
