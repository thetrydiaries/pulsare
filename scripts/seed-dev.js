/**
 * Seed 30 days of dummy data for visualising the cosmic web.
 * Paste the contents of this file into the browser console while
 * running `npx expo start --web` on localhost.
 *
 * Pattern: full / partial / missed / return across 30 days.
 * Wipes any existing localStorage data first.
 */
(function () {
  localStorage.clear();

  // ── Fixed habit IDs so log entries can reference them ───────────────────────
  const HABIT_IDS = {
    wake:     'habit_seed_wake',
    light:    'habit_seed_light',
    water:    'habit_seed_water',
    movement: 'habit_seed_movement',
    breath:   'habit_seed_breath',
    evening:  'habit_seed_evening',
  };
  const ALL_IDS = Object.values(HABIT_IDS);

  // ── Compute startDate = 29 days before today ─────────────────────────────────
  function fmt(d) {
    return d.toISOString().split('T')[0];
  }
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);

  // ── User ─────────────────────────────────────────────────────────────────────
  const user = {
    name: 'Shirley',
    startDate: fmt(start),
    currentPhase: 1,
    phaseUnlockState: 'active',
    wakeTime: '07:00',
    movementType: 'walk',
    breathworkExperience: 'no',
    breathworkPractice: null,
    eveningHabitType: 'reading',
    eveningHabitLabel: 'reading',
    projectName: null,
    notificationTimes: { morning: '07:00', movement: '08:00', windDown: '21:00' },
    startingMood: 'okay',
  };

  // ── Habits ───────────────────────────────────────────────────────────────────
  const ts = new Date().toISOString();
  const habits = {
    [HABIT_IDS.wake]:     { id: HABIT_IDS.wake,     label: 'wake up alarm',       microExplanation: null, phase: 1, group: 'morning', locked: true,  isCustom: false, suggestedId: 'wake-anchor',          active: true, createdAt: ts },
    [HABIT_IDS.light]:    { id: HABIT_IDS.light,    label: 'morning light',        microExplanation: null, phase: 1, group: 'morning', locked: false, isCustom: false, suggestedId: 'morning-light',         active: true, createdAt: ts },
    [HABIT_IDS.water]:    { id: HABIT_IDS.water,    label: 'water before coffee',  microExplanation: null, phase: 1, group: 'morning', locked: true,  isCustom: false, suggestedId: 'water-before-coffee',   active: true, createdAt: ts },
    [HABIT_IDS.movement]: { id: HABIT_IDS.movement, label: 'walk',                 microExplanation: null, phase: 1, group: 'morning', locked: false, isCustom: false, suggestedId: 'morning-movement',      active: true, createdAt: ts },
    [HABIT_IDS.breath]:   { id: HABIT_IDS.breath,   label: 'nervous system reset', microExplanation: null, phase: 1, group: 'morning', locked: false, isCustom: false, suggestedId: 'nervous-system-reset',  active: true, createdAt: ts },
    [HABIT_IDS.evening]:  { id: HABIT_IDS.evening,  label: 'reading',              microExplanation: null, phase: 1, group: 'evening', locked: false, isCustom: false, suggestedId: 'evening-anchor',        active: true, createdAt: ts },
  };

  // ── 30-day pattern (index 0 = startDate, index 29 = today) ──────────────────
  // full    = 6/6 habits done (≥3 threshold → full star)
  // partial = 2/6 habits done (>0 but <3 → partial star)
  // missed  = no log entry    (→ ghost star)
  // return  = 6/6 + isReturnDay flag (→ teal star)
  const PATTERNS = [
    'full',    // day  1
    'full',    // day  2
    'full',    // day  3
    'partial', // day  4
    'full',    // day  5
    'missed',  // day  6
    'full',    // day  7
    'full',    // day  8
    'partial', // day  9
    'full',    // day 10
    'full',    // day 11
    'missed',  // day 12
    'missed',  // day 13
    'return',  // day 14  (came back after 2 missed)
    'full',    // day 15
    'full',    // day 16
    'partial', // day 17
    'full',    // day 18
    'full',    // day 19
    'missed',  // day 20
    'full',    // day 21
    'full',    // day 22
    'partial', // day 23
    'full',    // day 24
    'missed',  // day 25
    'missed',  // day 26
    'return',  // day 27  (came back after 2 missed)
    'full',    // day 28
    'partial', // day 29
    'full',    // day 30  (today)
  ];

  // ── Write log entries ────────────────────────────────────────────────────────
  let streakCount = 0;
  let lastPresentDay = null;

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = fmt(d);
    const pattern = PATTERNS[i];

    if (pattern === 'missed') {
      // No entry = missed — don't write anything
      if (streakCount > 0 && dateStr < fmt(today)) streakCount = 0;
      continue;
    }

    const isReturnDay = pattern === 'return';
    // full/return = all 6 done; partial = first 2 only
    const doneCount = pattern === 'partial' ? 2 : 6;
    const habitsMap = {};
    ALL_IDS.forEach((id, idx) => { habitsMap[id] = idx < doneCount; });

    localStorage.setItem(`habitLog:${dateStr}`, JSON.stringify({
      habits: habitsMap,
      bodyCheckWord: null,
      isReturnDay,
      dayBoundaryApplied: true,
    }));

    if (dateStr < fmt(today)) {
      streakCount++;
      lastPresentDay = dateStr;
    }
  }

  // ── Streak data ──────────────────────────────────────────────────────────────
  // Simplified: count backward from yesterday until first non-present day
  // (today's full entry would add 1 more, but we keep it simple here)
  localStorage.setItem('streakData', JSON.stringify({
    currentStreak: streakCount,
    lastPresentDay,
  }));

  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('habits', JSON.stringify(habits));
  localStorage.setItem('onboardingComplete', 'true');

  console.log(
    `✓ Seeded 30 days of data (startDate: ${fmt(start)}).\n` +
    `  full: ${PATTERNS.filter(p => p === 'full').length}  ` +
    `partial: ${PATTERNS.filter(p => p === 'partial').length}  ` +
    `missed: ${PATTERNS.filter(p => p === 'missed').length}  ` +
    `return: ${PATTERNS.filter(p => p === 'return').length}\n` +
    'Reloading...'
  );

  location.reload();
})();
