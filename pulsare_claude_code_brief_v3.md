# Pulsare — Claude Code Brief v3
## Amendments & New Features

Apply these changes on top of the existing build. Do not rewrite what's working. Patch only what's referenced below.

Two conceptual threads run through this brief:

1. **Progressive depth ("deepening the anchor")** — Phase 1 habits don't change week to week, but what the user understands about them, and how precisely they execute them, does. Week 1: do the habits. Week 2: learn why the timing matters. Week 3: formalise the if-then stacks. This is the loading concept — not more habits, but increasing intentionality layered onto the same anchors.

2. **Galaxy expansion** — the galaxy screen becomes the primary data view, absorbing per-habit completion counts and the weekly concept card that currently lives on Learn.

---

## UI Amendments

### UI 1 — Custom habits: first-class upgrade

**Current behaviour:** Custom habits can be added and removed but receive no notification, no Learn entry, and cannot be edited after creation.

**Amendment — three targeted changes:**

**1. Editing.** Long press on a custom habit row currently reveals *"remove this habit"*. Add a second option above it: *"edit"*. Tapping "edit" opens the same bottom sheet as creation, pre-filled with the current label and group. The user can change the label and/or switch the group (morning ↔ evening). Saving updates the habit record in MMKV. The habit ID does not change — the habit log is unaffected.

**2. Optional notification.** The post-onboarding custom habit bottom sheet gains a third optional field, appearing after the morning/evening toggle is set:

> *"remind me at"* — a time picker, defaulting to 90 minutes after wake time for morning habits, wind-down time for evening habits. Optional — skipping leaves no notification for this habit.

Store the notification time on the habit record as `customNotificationTime: "HH:MM" | null`. Schedule via `expo-notifications` using the same pattern as the three anchor alarms. Notification copy:

> *"[habit label]. just this."*

Maximum one custom habit notification active at a time. If the user adds a second custom habit with a notification, a quiet inline note appears in the bottom sheet: *"you already have a reminder set for [first custom habit label]. adding this will replace it."* This is informational — they can proceed or skip.

**3. Optional personal reason.** Beneath the notification time picker, a second optional field:

> *"why does this matter to you?"*

Free text, 80 characters max. Placeholder in tertiary text: *"for me, because..."*. If filled, this string becomes the body text of the habit's Learn accordion entry (see Feature 8). If left blank, the habit has no Learn entry — no gap, no placeholder, just absent.

---

### UI 2 — Onboarding: resume from last screen

**Current behaviour:** If the user backgrounds the app mid-onboarding or the app is terminated, onboarding restarts from Screen 1.

**Amendment:** Persist onboarding progress to MMKV after every screen advance. On app open, before rendering any route:

- If `user.onboardingComplete === true` → go to home screen as normal
- If `user.onboardingComplete === false` (or key absent) AND `onboarding.lastCompletedScreen` exists → resume from that screen, no prompt, no explanation, just pick up where they left off
- If neither key exists → start from Screen 1

Store in MMKV:
```json
{
  "onboarding": {
    "lastCompletedScreen": 4,
    "partialData": {
      "name": "string | null",
      "startingMood": "string | null",
      "wakeTime": "HH:MM | null",
      "movementType": "string | null",
      "breathworkExperience": "yes | no | null",
      "eveningHabitType": "string | null",
      "eveningHabitLabel": "string | null",
      "notificationTimes": { "morning": null, "movement": null, "windDown": null },
      "projectName": "string | null",
      "startDate": "YYYY-MM-DD | null"
    }
  }
}
```

`partialData` is written incrementally as each screen completes. On resume, pre-fill any screens that have already been answered — the user should not have to re-enter their name if they already typed it.

On `onboardingComplete: true`, the `onboarding` key is no longer read. It can remain in MMKV — do not delete it.

**No recovery path for reinstall in v1.** If the app is deleted and reinstalled, no MMKV data exists and onboarding starts fresh. Cloud sync (future) will handle cross-device restore.

---

## New Features

### FEATURE 8 — Progressive depth: the anchoring protocol

**What this is:** Phase 1's three weeks each have a distinct conceptual layer that deepens how the user relates to their existing habits. The habits themselves don't change. What changes is the user's understanding and execution precision. The term for this across the app is **"deepening the anchor"** — used in the week label, the Learn concept card, and the milestone greetings.

Week 1: presence — just show up  
Week 2: timing — understand when and why  
Week 3: stacking — formalise the if-then sequence

This is implemented across three surfaces: the home screen week label, the Learn "this week" concept card, and the milestone greeting system.

---

#### Part A — Home screen: week layer label

The current phase label in the status bar reads *"phase 1 · stabilise"*. Add a second line beneath it in tertiary text, Outfit 300, that reflects the current week's depth layer:

| Week | Layer label |
|------|------------|
| 1 | *"week 1 · presence"* |
| 2 | *"week 2 · timing"* |
| 3 | *"week 3 · stacking"* |
| 4+ | Layer label disappears — Phase 2 label takes over |

The layer label sits directly beneath the phase label, same right-aligned position, smaller and fainter. It is not tappable.

---

#### Part B — Learn screen: phase 1 weekly concept cards

Replace the current three Phase 1 concept cards (circadian rhythm / cortisol awakening response / neuroplasticity) with three new cards that map directly to the depth layer for each week. The existing card format (title + one-sentence definition + 3–4 paragraph body + "new concept in N days" footer) is unchanged.

**Week 1 — Presence**

Title: *"presence"*

One-sentence definition: *"showing up consistently — even imperfectly — is the signal your nervous system needs most."*

Body (3–4 paragraphs, plain language):

> Paragraph 1: The nervous system doesn't respond to effort — it responds to patterns. What you're building this week isn't a set of habits. It's a signal. Every time you wake at the same time, drink water before coffee, move your body, and breathe intentionally, you're sending a low-level message to your HPA axis: the day is predictable. Safety is the precondition for regulation.

> Paragraph 2: Presence means you showed up. Not that you did it perfectly, or for the full duration, or at the exact right time. A 10-minute walk at 11am counts. Breathwork in the car counts. The nervous system doesn't grade on effort — it tracks repetition.

> Paragraph 3: This is also why the never-miss-twice rule is structural, not motivational. One missed day is noise. Two consecutive missed days is a pattern. The system is designed to make the second miss nearly impossible — not through guilt, but through design.

> Paragraph 4: This week: just do the things. Don't think about doing them well. The precision comes in week 2.

**Week 2 — Timing**

Title: *"timing"*

One-sentence definition: *"your nervous system runs on a 24-hour clock — and when you do things matters as much as whether you do them."*

Body (3–4 paragraphs, plain language):

> Paragraph 1: Your circadian rhythm is governed by the suprachiasmatic nucleus (SCN) — a cluster of about 20,000 neurons in your hypothalamus that acts as your master body clock. It regulates cortisol, melatonin, body temperature, appetite, and mood across a 24-hour cycle. The SCN is primarily set by light, but it's reinforced by behavioural anchors — which is exactly what you've been building.

> Paragraph 2: Here's what's happening in your morning window right now. Cortisol peaks naturally in the 30–45 minutes after waking — this is called the cortisol awakening response (CAR). It's your body's own alarm system: a burst of energy and alertness designed to prepare you for the day. Caffeine on top of that spike builds tolerance fast and blunts the CAR over time. Morning light within 30 minutes of waking amplifies it. Movement 45–60 minutes in hits the peak window for BDNF — the protein that drives neuroplasticity. You've been doing all of this. This week you'll start to understand why the sequence matters.

> Paragraph 3: The anchors you've been building aren't arbitrary. They're timed to your body's own chemistry. Wake at the same time → cortisol rises on schedule. Light within 30 minutes → melatonin suppresses cleanly. Movement at 45–60 minutes → BDNF peaks. Water before coffee → cortisol spike stays regulated. Each one feeds the next. This is why the order matters, and why the order in which your habits appear on the home screen reflects the sequence — not just a list.

> Paragraph 4: This week: do the habits in order. Don't rush through them. The gap between waking and coffee is as important as the coffee itself.

**Week 3 — Stacking**

Title: *"stacking"*

One-sentence definition: *"linking habits to existing cues pre-loads the behaviour into memory — so the decision gets made once, not every morning."*

Body (3–4 paragraphs, plain language):

> Paragraph 1: Implementation intentions are one of the most replicated findings in behavioural psychology. The research is simple: people who form an explicit if-then plan — *"after I wake up, I will go directly to the kitchen and drink water before touching my phone"* — follow through at two to three times the rate of people who just intend to do the habit. The mechanism isn't motivational. It's neurological. The if-then plan pre-loads the behaviour into working memory, so when the cue fires, the routine activates automatically — without requiring deliberate prefrontal cortex decision-making.

> Paragraph 2: This matters enormously for executive dysfunction. The prefrontal cortex — the part of the brain responsible for initiation, planning, and follow-through — is the exact system that's impaired. Every time a habit requires a new decision to start, you're asking the PFC to do something it's currently struggling with. Habit stacking bypasses that. The cue does the initiating. The PFC just follows.

> Paragraph 3: You've been building the habits. This week you're building the architecture that makes them automatic. The if-then stacks in your protocol are already written — you can find them in your anchoring stack below. Read them. Say them out loud if that helps. The research suggests that the act of forming the plan, not just reading it, is what encodes it.

> Paragraph 4: By the end of this week, the morning sequence shouldn't feel like a list of things to remember. It should feel like one thing that unfolds from the first cue.

---

#### Part C — Anchoring stack: onboarding screen update

The implementation intentions screen already exists in onboarding (step 12/13, added in a previous brief). It shows four pre-built if-then stack cards using the user's actual habit choices.

**Amendment:** Add a fifth card to the existing stack, specific to Week 3's stacking concept. This card is not shown during onboarding — it surfaces for the first time on the Learn screen in Week 3 as an addition to the existing concept card body.

The Week 3 Learn card body ends with a new section:

> *"your anchoring stack"*

In Outfit 500, secondary text colour, with 16pt top margin. Beneath it, a scrollable horizontal row of the user's actual if-then statements — pulled from the onboarding implementation intentions screen, displayed as simple pill cards. Each pill: Outfit 300, tertiary text colour, surface `#141414`, 1px border `#1c1c1c`, 12px corner radius. One statement per pill.

Example pills (using personalised labels):
- *"after my alarm, I go straight to morning light"*
- *"after morning light, I drink water before coffee"*
- *"after water, I go for my walk"*
- *"after my walk, I do the sigh"*

These are read-only. No interaction. Just a mirror of what they built in onboarding, now surfaced at the moment the science behind it lands.

---

#### Part D — Milestone greetings

Three milestone days in Phase 1 trigger a modified home screen greeting. The greeting change is the only signal — no modal, no notification, no badge. It appears once and returns to the normal rotation the following day.

| Day | Greeting |
|-----|---------|
| Day 3 | *"three days. your nervous system is already listening, [Name]."* |
| Day 7 | *"one week. the anchor is holding."* |
| Day 21 | *"three weeks. that's neuroplasticity. phase 2 is ready when you are."* |

These strings are generated by the AI personalised copy call. Extend the existing Feature 3 prompt to include a `milestoneGreetings` object:

```json
"milestoneGreetings": {
  "day3": "string",
  "day7": "string",
  "day21": "string"
}
```

The prompt instruction for these strings:

> Milestone greetings: short, warm, lowercase. Day 3 should acknowledge that something has started. Day 7 should feel like a quiet landmark, not a celebration. Day 21 should feel like completion of something real, with a gentle forward momentum toward phase 2. Never use: "amazing", "great job", "proud", "crushing it". Always include the user's name in at least one of the three. 3–8 words each.

**Logic:** On each app open, after the greeting is determined by time band, check whether today is a milestone day (days elapsed since `startDate` equals 3, 7, or 21). If yes, and if the milestone greeting has not already been shown (store `shownMilestones: string[]` in MMKV under `personalisedCopy`), display the milestone greeting instead of the standard greeting. Add the milestone key to `shownMilestones` after display. Standard greeting rotation resumes the next day.

**Milestone day calculation:** Use `getLogicalDate()` and the existing `daysAgo` / start date logic. Day 1 = the start date itself. Day 3 = start date + 2 calendar days. Uses the 3am logical boundary already in place.

---

### FEATURE 9 — Prescriptive breathwork: weekly technique rotation

**What this is:** The breathwork habit becomes prescriptive across Phase 1 — each week introduces a specific technique with a specific neurological purpose. By the end of Phase 1 the user has tried three techniques. At Phase 2 unlock they choose one as their default. The other techniques remain accessible in Learn.

This is not exploratory — the sequence is deliberate and the rationale is surfaced.

---

#### The technique sequence

| Week | Technique | Neurological purpose | Session length |
|------|-----------|---------------------|---------------|
| 1 | Physiological sigh | Acute stress reset. Fastest known method to downregulate the autonomic nervous system. Double inhale through nose, long exhale through mouth. | 2 min |
| 2 | Cyclic sighing | Sustained vagus nerve activation, HRV recovery. Extended exhale ratio (inhale 4, exhale 8). Best for post-movement nervous system settling. | 3 min |
| 3 | Box breathing | Prefrontal cortex activation, amygdala suppression. Equal ratio (4-4-4-4). Best used before focused work — primes Phase 2 project habit. | 4 min |

4-7-8 is reserved for the evening anchor (wind-down breathwork) for users who chose breathwork as their evening habit. It is not in the Phase 1 morning rotation — its primary effect (maximum parasympathetic activation) is sleep-onset optimised, not morning-appropriate.

---

#### Breathwork guide screen

A new screen, accessible from the breathwork habit row only — not from navigation. Triggered by a small guide affordance on the habit row (see below).

**Trigger affordance:** A barely-visible *"guide"* label in tertiary text sits to the left of the habit's tap circle, right-aligned to the habit name. Tapping it opens the breathwork guide as a modal (slide up from bottom). Tapping the tap circle completes the habit as normal — these are two separate tap targets.

**Guide screen spec:**

Full-screen modal. Dark background (`#0c0c0c`). Dismisses on swipe down. No `×` button — swipe only. The guide stays open while the user breathes; it does not auto-dismiss.

Layout, top to bottom:

1. **Technique name** — Playfair Display 400 italic, primary text colour, large. E.g. *"physiological sigh"*

2. **One-line purpose** — Outfit 300, secondary text colour. E.g. *"acute reset. the fastest way to shift your nervous system."*

3. **Animated breath circle** — a circle that expands and contracts in sync with the breath rhythm. Expanding = inhale, holding = hold (no animation change, just pause), contracting = exhale.
   - Circle fill: teal (`#3d6b58`) at low opacity (0.15), teal border (`#8fb0a4`) at 0.6 opacity
   - Circle size range: 120pt (minimum, exhale) to 200pt (maximum, inhale)
   - Animation uses `Animated.timing`, `useNativeDriver: false` (size changes require JS driver)
   - Respects `prefers-reduced-motion`: if enabled, circle does not animate — show static circle at mid-size and text-only phase labels instead

4. **Phase label** — Playfair Display 400 italic, primary text colour, centred beneath the circle. Single word: *"inhale"* / *"hold"* / *"exhale"*. Updates in sync with the animation.

5. **Phase timer** — Outfit 300, tertiary text colour, beneath the phase label. Counts down the seconds for the current phase (e.g. *"4"* → *"3"* → *"2"* → *"1"*). Does not display for phases with no hold.

6. **Round counter** — Outfit 300, tertiary text colour, bottom of screen. E.g. *"round 2 of 4"*. Updates after each full breath cycle.

7. **"done"** button — pill-shaped, teal border, no fill. Outfit 400. Appears only after the minimum session length has elapsed (2 / 3 / 4 minutes depending on technique). Tapping "done" marks the breathwork habit as complete and dismisses the modal. If the user dismisses via swipe before "done" appears, the habit is NOT auto-completed — they can tap the habit circle manually on return.

**Breath timing per technique:**

```
physiologicalSigh:
  cycles: repeat until 2 min elapsed
  phases: [inhale1: 1.5s, inhale2: 0.5s, exhale: 4s]
  note: double inhale — two separate inhale animations (small expand, then larger expand)

cyclicSigh:
  cycles: repeat until 3 min elapsed
  phases: [inhale: 4s, exhale: 8s]
  note: no hold phase

boxBreathing:
  cycles: repeat until 4 min elapsed (approximately 4 cycles at 16s each)
  phases: [inhale: 4s, holdIn: 4s, exhale: 4s, holdOut: 4s]
```

**Technique switching:** The guide always shows the current week's prescribed technique. The technique is determined by week number from `startDate`, using the same week calculation as the rest of the app. The user cannot manually switch techniques in Phase 1 — the prescription is the point.

---

#### Learn screen: breathwork library

The existing Learn screen habit accordion for the breathwork habit gains a new expandable sub-section beneath the science copy:

> *"breathwork library"*

In Outfit 500, secondary text colour. A horizontal scrollable row of technique cards — one per technique introduced so far (unlocks progressively: week 1 shows physiological sigh only, week 2 adds cyclic sigh, week 3 adds box breathing). Each card:

- Technique name in Outfit 400
- 1-line purpose in Outfit 300, tertiary text colour
- *"try it →"* in teal label colour — taps directly to the breathwork guide for that technique (guide works outside the habit row context, just without the habit-completion affordance)

4-7-8 appears in the library as a locked card for users who did not choose breathwork as their evening anchor. Label: *"4-7-8 · sleep onset"*. Sub-label: *"unlocks as your evening breathwork practice."* Teal border, no *"try it"* — informational only.

---

#### Phase 2 unlock: choose your default

At Phase 2 unlock, before the standard unlock prompt, a new interstitial screen:

> *"you've tried three approaches. which felt most useful?"*

Three option tiles — one per technique used in Phase 1. Same tile format as the movement and evening anchor onboarding screens. A fourth option: *"I'll keep rotating"* — keeps the weekly prescription behaviour going.

On selection, store `breathworkDefault: "physiological-sigh" | "cyclic-sigh" | "box-breathing" | "rotating"` in user MMKV. From Phase 2 onward, the breathwork guide always opens to the user's chosen technique. The breathwork library in Learn remains fully accessible.

---

### FEATURE 10 — Galaxy expansion: per-habit completion counts

**What this is:** The galaxy screen gains a new tab — **"anchors"** — sitting alongside week / month / year. This tab shows per-habit lifetime completion counts in the galaxy's visual language. It is the primary data view for individual habit progress.

**Note on star PNG assets:** The changelog confirms hand-drawn PNG assets are already integrated into the app. The galaxy MVP rendering spec (SVG fallback) in the v4→v5 amendments doc is now superseded — PNGs are live. This feature uses the existing star asset pipeline.

---

#### Galaxy screen tab update

Current tabs: week / month / year

New tabs: week / month / year / anchors

The "anchors" tab sits rightmost. Same text-only tab style as the others, active state underlined in teal.

---

#### Anchors tab spec

A scrollable vertical list. Each row represents one active habit, ordered by: protocol habits first (in their morning/evening sequence order), then custom habits.

**Row anatomy:**

```
[star mark]  [habit label]              [count]
             [7-day sparkline]
```

- **Star mark** — the full star PNG asset at 20×20pt, full opacity. Same asset used in the galaxy. Sits left-aligned, vertically centred on the habit label.
- **Habit label** — Outfit 400, secondary text colour. Uses `userLabel` if set, otherwise default label. Same label as the home screen habit row.
- **Completion count** — Playfair Display 400, primary text colour, right-aligned. Large — 28pt. This is the number that matters. Lifetime completions only — every tap that logged this habit since the start date.
- **"times"** — Outfit 300, tertiary text colour, beneath the count, right-aligned. 12pt. Just the word *"times"*.
- **7-day sparkline** — a row of 7 small star marks (one per day, Mon–Sun for the current week), displayed beneath the habit label. Uses the same four star states as the galaxy: full / partial (not applicable at habit level — each day is either done or not, so only full or missed states apply) / missed / return. Star size: 12×12pt. Day letters above (M T W T F S S) in tertiary text, 9pt. Today's star renders at 14×14pt.

Rows are separated by a single 0.5px `#1c1c1c` rule. No cards, no surface backgrounds — the list is open, same horizontal padding as the star canvas (safe area inset + 20pt).

**Empty state** (user has no completions yet — only possible on day 1): a single line in tertiary text, centred: *"your first completion will appear here."* No illustration, no call to action.

**Stats row:** The existing three-number stats row (days present / presence rate / streak) moves from below the star canvas to above the tab row. It sits between the cosmic web line and the tabs, giving it permanent visibility regardless of which tab is active.

---

#### Data requirements

No new storage writes required. The anchors tab reads from the existing `habitLog` in MMKV — it counts `habitLog[date].habits[habitId] === true` across all logged dates for each active habit. This is a read-only aggregation at render time.

Performance note: the existing O(n) parse fix in `presence.ts` (May 5 engineering review) resolved the per-tap cost. The anchors tab aggregation runs once on tab focus, not on every render. Cache the result in component state and refresh on tab focus via `useFocusEffect`.

---

### FEATURE 11 — Body check word: weekly pattern surfacing

**What this is:** The daily body check word is currently collected and shown in the weekly reflection header but never analysed. This feature surfaces a simple pattern from the accumulated words — not as an insight engine, but as a quiet mirror. One line, once a week, on the reflection screen.

**Science note:** This is low-cost, high-value. The body check word practice itself builds interoceptive awareness (anterior insula–mPFC circuit). Showing the pattern back to the user reinforces the feedback loop — they start to notice their own rhythms, which is itself the therapeutic mechanism.

---

#### Where it appears

On the weekly reflection screen (Sunday only), between the week's body check word list and the first reflection question. A single line:

> *"[word] shows up most this week."*

In Outfit 300 italic, secondary text colour. Calculated from the 7 body check words for the current week. If the user has fewer than 3 words logged this week (too sparse to be meaningful), this line does not appear. If all words are different (no repeats), the line reads:

> *"seven different words this week."*

No further analysis. No interpretation. No graph. Just the observation.

**Calculation:** Find the mode of the current week's body check words (case-insensitive, trim whitespace). If a clear mode exists (one word appears more than once), use it. If tied, use the most recent of the tied words. If no repeats, use the "seven different words" fallback.

**Storage:** No new storage required. Reads from `habitLog[date].bodyCheckWord` for the 7 days of the current week.

---

## AI Copy Generation — prompt extensions

The existing Feature 3 API call in `personalisedCopy.ts` must be extended to include two new fields. Update the prompt and the expected JSON shape.

**Add to the JSON response format:**

```json
{
  "habitExplanations": { ... },
  "completionAcknowledgements": { ... },
  "greetingVariations": { ... },
  "milestoneGreetings": {
    "day3": "string",
    "day7": "string",
    "day21": "string"
  },
  "breathworkIntros": {
    "physiological-sigh": "string",
    "cyclic-sigh": "string",
    "box-breathing": "string"
  }
}
```

**`milestoneGreetings` prompt instruction** (add to existing prompt):

> Milestone greetings: three short strings, all lowercase except the user's name. Day 3 should acknowledge that something has started without making it feel like a big deal. Day 7 should feel like a quiet landmark — real but not loud. Day 21 should feel like genuine completion of something, with forward momentum toward what's next. Never use: "amazing", "great job", "proud", "crushing it", "well done". Include the user's name in at least one. 3–10 words each.

**`breathworkIntros` prompt instruction** (add to existing prompt):

> Breathwork intro lines: one line per technique, displayed at the top of the breathwork guide screen beneath the technique name. Lowercase. Warm, direct, minimal. Should communicate the purpose of this specific technique in plain language — not the mechanism, the feeling or the use case. E.g. for physiological sigh: "the fastest reset. two breaths is enough." Max 10 words each. Reference the user's context where relevant (e.g. if they described themselves as running on empty, the sigh intro might acknowledge urgency).

**Fallback strings** (used if generation fails or key is absent):

```
milestoneGreetings:
  day3: "three days. something has started."
  day7: "one week. the anchor is holding."
  day21: "three weeks. that's neuroplasticity."

breathworkIntros:
  physiological-sigh: "the fastest reset. two breaths is enough."
  cyclic-sigh: "longer exhale. vagus nerve. three minutes."
  box-breathing: "equal sides. prefrontal cortex on. four minutes."
```

---

## Data model additions

No new top-level MMKV keys required. Two additions to existing structures:

**1. On the `user` object:**
```json
{
  "breathworkDefault": "physiological-sigh | cyclic-sigh | box-breathing | rotating | null"
}
```
`null` until Phase 2 unlock interstitial is completed.

**2. On the `personalisedCopy` object** (existing MMKV key):
```json
{
  "milestoneGreetings": { "day3": "string", "day7": "string", "day21": "string" },
  "shownMilestones": [],
  "breathworkIntros": {
    "physiological-sigh": "string",
    "cyclic-sigh": "string",
    "box-breathing": "string"
  }
}
```

**3. On the `onboarding` object** (new key, see UI 2):
```json
{
  "lastCompletedScreen": 0,
  "partialData": { ... }
}
```

---

## Pre-delivery checklist

- [ ] Onboarding resumes from last completed screen on re-open — test by killing the app on screen 6 and confirming resume
- [ ] Onboarding partial data pre-fills correctly on resume — name, wake time, movement choice survive a kill/reopen
- [ ] Custom habit edit option appears on long press above remove option — does not appear on locked habits
- [ ] Custom habit notification schedules correctly — test by setting a 1-minute-from-now time and confirming it fires
- [ ] Only one custom habit notification active at a time — adding a second replaces the first
- [ ] Custom habit "why does this matter" field saves and appears in Learn accordion — if blank, no accordion entry for that habit (no placeholder)
- [ ] Week layer label appears beneath phase label on home screen: "week 1 · presence", "week 2 · timing", "week 3 · stacking" — disappears from Phase 2 onward
- [ ] Learn concept cards for weeks 1–3 display the new presence / timing / stacking content, not the old circadian rhythm / CAR / neuroplasticity cards
- [ ] Anchoring stack pills appear at the bottom of the Week 3 Learn card — uses the user's actual personalised habit labels
- [ ] Milestone greetings fire on days 3, 7, and 21 — only once each (test with developer mode retroactive start date)
- [ ] Milestone greeting does not repeat the next day — standard greeting rotation resumes
- [ ] Breathwork guide opens from the "guide" affordance on the habit row — does not open from the tap circle
- [ ] Breathwork guide shows correct technique for current week (week 1 = physiological sigh, week 2 = cyclic sigh, week 3 = box breathing)
- [ ] Physiological sigh animation shows double-inhale correctly (two expand phases)
- [ ] "done" button on breathwork guide only appears after minimum session time has elapsed
- [ ] Swiping down before "done" does NOT complete the habit — habit circle on home screen still shows incomplete
- [ ] Reduce-motion: breathwork guide shows static circle and text-only phase labels — no animation
- [ ] Breathwork library in Learn accordion shows techniques unlocked so far — week 1 shows only physiological sigh, week 2 adds cyclic sigh, etc.
- [ ] "try it →" in breathwork library opens the guide without the habit-completion affordance
- [ ] Phase 2 unlock interstitial appears before the standard unlock prompt — three technique options + "I'll keep rotating"
- [ ] `breathworkDefault` stored correctly in MMKV after Phase 2 interstitial selection
- [ ] Galaxy "anchors" tab appears as fourth tab — week / month / year / anchors
- [ ] Anchors tab shows all active habits in correct order (protocol habits first, then custom)
- [ ] Completion count reads correctly from habit log — test against a known number of completions using developer mode
- [ ] 7-day sparkline shows correct star states for current week — full star on completed days, ghost on missed
- [ ] Stats row (days present / presence rate / streak) moves above the tab row — visible on all tabs
- [ ] Body check word pattern line appears on Sunday reflection screen when ≥3 words logged this week
- [ ] Pattern line does not appear when fewer than 3 words logged
- [ ] "seven different words this week" fallback appears correctly when all 7 words are unique
- [ ] AI copy generation includes `milestoneGreetings` and `breathworkIntros` — test by clearing `personalisedCopy` from MMKV and completing onboarding again
- [ ] All fallback strings render correctly when `personalisedCopy` key is absent
- [ ] `shownMilestones` array persists across app closes — milestone greeting does not re-fire after being shown
