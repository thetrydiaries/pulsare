# Pulsare — App Build Prompt v5

Use this prompt when you're ready to build. Hand it to Claude Code and it will have everything it needs. It can also serve as a brief for a developer.

---

## What this app is

A personal nervous system reset tracker for someone recovering from burnout and managing executive dysfunction, depression, and HPA axis dysregulation. The app is called **Pulsare**.

The core design philosophy: **designed for the brain you have, not the brain you want.** Every element must reduce initiation cost. Fewer decisions = more likelihood of crossing the threshold and doing the thing.

This is not a productivity app. It is a recovery and regulation tool. The tone should feel calm, warm, and non-judgmental — never gamified in a way that adds pressure, never clinical, never loud.

The protocol is rooted in neuroscience and behavioural psychology. Every habit anchor exists for a specific physiological or neurological reason. That reasoning is surfaced to the user — briefly, contextually, never as a lecture.

---

## Core principles to build around

- Track presence (did I show up) — not quality, duration, or output
- Immediate feedback after each habit — not end-of-day logging
- Never-miss-twice rule is structural, not motivational
- Returning after a fall-off must be frictionless — one tap, no guilt prompt
- Visual simplicity is non-negotiable — a foggy brain must be able to use this
- Autonomy is therapeutic — the user personalises the anchors, not the protocol
- Perceived control reduces cortisol — every design decision that gives the user agency is also a nervous system intervention

---

## Onboarding — "let us get to know you"

The onboarding is not a setup flow. It is the first moment the app does something for the user. The framing throughout is warm and conversational — a friend who understands, not a form asking for data.

Complete onboarding before any habits appear. Should take 4–6 minutes maximum. One question per screen. No numbered progress bar. A single quiet pip indicator — a row of thin lines that fill as the user advances — is acceptable. No percentages, no "step 4 of 11".

### Screen 1 — Welcome
Large, warm text only. No logo. No tagline yet.

> "You're here. That's already something."

A single button: **"let's begin"**

---

### Screen 2 — Name
> "What do you want me to call you?"

Free text field. First name only. Used throughout the app in every greeting — never "user", never skipped.

---

### Screen 3 — Where you're starting from
Not a clinical intake. One warm, open question:

> "[Name], how are you doing — honestly?"

Four options, tap one:
- "Running on empty"
- "Holding it together, barely"
- "Not great, but I'm ready to try something"
- "I've been here before — I know what I need"

This answer calibrates the tone of the first week's notifications only. It is not stored as a data point or referenced again. Its purpose is to tell the user: this app sees them.

---

### Screen 4 — The science, briefly
One paragraph. Warm, plain language. No jargon.

> "Pulsare works by rebuilding your nervous system from the ground up — starting with the things that regulate everything else: when you wake, how you move, and how you breathe. Like a pulsar, the most stable signal in the known universe, it's consistency that does the work. We add slowly. We never punish a missed day. Small, regular signals to your body are more powerful than big efforts followed by crashes."

Single button: **"that makes sense"**

---

### Screen 5 — Your wake anchor
> "What time do you want to wake up?"

Time picker. Default shown: 7:00am.

Micro-explanation beneath the picker:
> *"Your wake time is the anchor for everything else. Your body clock regulates cortisol, mood, and energy — and it needs consistency more than the 'perfect' time. Choose what you can protect, not what sounds ideal."*

---

### Screen 6 — Your morning movement
> "How do you want to move in the mornings?"

Warm option tiles — not a dropdown:
- Morning walk
- Walk with someone
- Swim
- Cycle
- Yoga / stretching
- Something else → free text

Micro-explanation:
> *"In Phase 1, this isn't exercise — it's a signal. Low-intensity morning movement helps reset cortisol rhythm and tells your nervous system the day is safe to begin. Outdoors is best, but not required."*

---

### Screen 7 — Your breathing practice
> "Have you tried any breathwork before?"

Two options:
- "Yes, I know what I'm doing"
- "No — show me something simple"

If **"show me something simple"** → inline explainer expands:
> "We'll use something called a physiological sigh. Two short inhales through the nose, then one long exhale through the mouth. That's it. Two minutes. It's the fastest known way to activate your parasympathetic nervous system — faster than meditation, faster than walking. You'll be reminded once a day."

If **"Yes"** → optional free text: "What do you use?" The app respects their existing practice and simply prompts them to do it.

---

### Screen 8 — Your evening anchor
> "How do you want to end your day?"

This screen establishes the user's evening habit — the fifth anchor in Phase 1, and the only one that sits in the evening group on the home screen.

Warm option tiles:
- Reading — fiction or otherwise
- Phone off — no screens after a chosen time
- Breathwork — a wind-down practice
- Journalling — three sentences
- Something else → free text

Micro-explanation:
> *"Your evening anchor is as important as your morning one. The nervous system needs a consistent signal that the day is ending. Choose something you'll actually do."*

The chosen option becomes the personalised label for the evening habit row. The time it appears on the home screen is set by the user's wind-down notification time (Screen 9).

---

### Screen 9 — Your notification times
> "We'll send you three gentle reminders a day. Here are the defaults — change anything."

Three editable time pickers:
- Morning anchor — default: user's chosen wake time — label: *"your wake time"*
- Movement reminder — default: 90 min after wake time — label: *"have you moved yet"*
- Wind-down — default: 9:30pm — label: *"wind down starts now"*

Micro-explanation:
> *"These aren't alarms. They're anchors. Consistent timing trains your nervous system more than any single habit."*

The wind-down time also determines when the evening habit group comes forward on the home screen — receded in the morning, fully visible from wind-down time onward.

---

### Screen 10 — Your project (Phase 2 preview)
Clearly framed as: "coming in a few weeks — just plant the seed now."

> "When you're ready — around week four — we'll add one hour a day on one thing that matters to you. What's something you've been meaning to build, write, or work on?"

Free text. No obligation. Placeholder examples in light text:
*a Substack, a side project, something creative, something that's been waiting*

Stored and surfaced again word-for-word at Phase 2 unlock. The user's own language is reflected back to them.

---

### Screen 11 — Your start date
> "When do you want to begin?"

Two options:
- **"Today"** (default, highlighted)
- **"Pick a date"** (calendar opens)

No friction if they pick a future date. No "why are you waiting" framing. They know their life.

---

### Screen 12 — Handoff
> "That's everything, [Name]. Your Reset starts now."

Personalised summary of their Phase 1 anchors:
- Wake at [their time]
- [Their movement] — before midday
- 2 minutes of breathing — any time
- Water before coffee
- [Their evening habit] — from [their wind-down time]

Single button: **"I'm ready"** → goes directly to Day 1 home screen, already populated with today's habits. No tutorial overlay. No feature tour. The home screen explains itself.

---

## The three phases — build all three, unlock progressively

### Phase 1: Stabilise (Weeks 1–3)

Five daily habits — the physiological foundation. Four morning, one evening. The split is determined by onboarding, not hardcoded.

**Morning habits:**
1. **Wake anchor** — user's chosen time, every day
2. **Water before coffee** — before any caffeine
3. **Morning movement** — user's chosen activity, low-to-moderate intensity only, before midday
4. **Nervous system reset** — 2 min physiological sigh or user's existing breathwork practice

**Evening habit:**
5. **[User's chosen evening anchor]** — personalised label, appears in the evening group

Habit rows in the daily view display the habit name only — no second line of text beneath. The science and reframes that were previously shown as micro-explanations have moved to the **Learn screen** (see In-app screens → Learn screen), where they have space to actually land.

Each habit row carries a barely-visible 2pt dot (tertiary colour) to the right of the name as a passive affordance — a signal that more context exists in Learn. No label, no tooltip.

**Phase 1 sleep note:**
Displayed as tertiary text directly beneath the "days present" label in the presence block (above the week strip):
> *"to protect your [wake time], aim to be in bed by [calculated: wake time minus 8.5hrs]."*

Not tracked. Not a metric. Always visible in the presence block.

**Presence threshold for Phase 1:** 3 or more of 5 habits complete = a present day.

---

### Phase 2: Build (Weeks 4–8)

Phase 2 unlocks as a **user-confirmed prompt**, not an automatic calendar switch.

At the start of Week 4, the app surfaces:
> "[Name], you've been showing up for three weeks. Phase 2 is ready — it adds new anchors, one at a time. Want to move forward, or stay here a little longer?"

Options:
- **"Let's go"** → Phase 2 activates
- **"Give me one more week"** → prompt returns in 7 days, no pressure language
- **"I'll decide later"** → dismissed, accessible from Phase Progress screen anytime

New habits added in Phase 2:
- **Consistent bedtime** — user's calculated target (shown from onboarding sleep note)
- **Breakfast** — simple, not perfect. *"eating within 90 min of waking supports cortisol regulation and blood sugar stability."*
- **Morning pages** — 3 sentences minimum. *"this isn't journalling for insight. it's a pressure valve. get it out of your head."*
- **Phone off before bed / reading** — fiction explicitly encouraged. *"narrative fiction reduces cortisol more measurably than non-fiction or scrolling. this is a legitimate nervous system tool."*
- **One hour on one thing** — user's chosen project (surfaced from their onboarding answer, in their own words), before 3pm

**Project habit initiation support:**
> *"open the file. that's the first two minutes. nothing else is required yet."*

**Presence threshold for Phase 2:** 5 or more of 9 habits complete = a present day.

---

### Phase 3: Raise the Stakes (Weeks 9–13)

User-confirmed unlock. Same prompt pattern as Phase 2.

New habits added:
- **Diet anchor** — user chooses one approach only at unlock: whole foods (80% of meals), cutting processed sugar, or mild caloric awareness (not tracking — just noticing). *"one approach. not a diet. your gut microbiome affects mood and cortisol — this is infrastructure, not aesthetics."*
- **Protected sleep** — sleep is now a tracked habit, not just a background note. Bedtime within 30 min of target counts as complete.
- **Project output** — one-hour target becomes 90 minutes. Initiation prompt remains.

Phase 3 framing in UI:
> "You're not raising the bar. You're protecting what you've built."

**Presence threshold for Phase 3:** 6 or more of 11 habits complete = a present day.

---

## Home screen — time-aware habit grouping

Habits on the home screen are organised into two groups: **morning** and **evening**. The grouping is determined by onboarding choices — it is never hardcoded.

**Time-of-day display logic:**

- **Morning habits** — fully visible and active from wake time onward
- **Evening habits** — visually receded (30% opacity) during morning and afternoon. Come forward to full opacity from the user's wind-down notification time onward
- **This is not hidden content** — the evening group is visible at all times, just visually quiet. The user can tap and complete an evening habit at any time — the receding is a visual cue, not a lock

The group labels ("morning" / "evening") are the faintest possible text — present as orientation, never as structure that adds weight.

---

## Galaxy view — the consistency record

The galaxy is the zoom-out view. It is the single place where the user can see the accumulated record of their presence over time. It lives on its own screen, accessed from the bottom navigation.

**The metaphor:**
Each day is a star. The density and brightness of stars across the view reflects how consistently the user showed up. Dense, bright regions are strong weeks. Sparse, dim regions are harder stretches. The whole thing, over time, becomes something made — a record of a life in motion.

This is not a score. There is no pass or fail. The metaphor is the cosmic web — the large-scale structure of the universe, which looks remarkably similar to a neural network under a microscope. The user is literally watching their neural pathways rebuild, represented as a galaxy forming. This connection should appear quietly in the onboarding and in the galaxy screen header — one line, not a lecture.

**Star states — four states, layered size + opacity for depth:**
- **Full day** (presence threshold met) — 24pt, opacity 0.9. Foreground.
- **Partial day** (at least 1 habit complete, below threshold) — 18pt, opacity 0.45. Mid-field.
- **Missed day** — 12pt, opacity 0.06. Background presence. Not an X. Not a gap. Just barely there.
- **Return day** (first day back after 2+ missed) — 26pt, teal tint (`#8fb0a4`), opacity 0.9. Distinct but not celebratory.
- **Future day** (placeholder, not a state) — 10pt, opacity 0.04. Not interactive.

Size and opacity working together create perceived depth — foreground stars (large, bright), mid-field (medium, moderate), background (small, faint). This is what makes the galaxy read as dimensional rather than a flat grid.

**Today's star (week strip + home screen only):** renders at 1.2× its state size as a "you are here" marker. Does **not** apply in the full galaxy view.

**Star assets:**
Hand-drawn in Procreate with pencil brush. A gestural four-point star shape — not a perfect geometric star, not a clip-art asterisk. Four assets × three density variants = 12 PNG files total. All PNGs are white (`#ffffff`) on a transparent background — colour, tint, and opacity are applied by the app at render time, never baked into the files.

Asset files live in `/assets/stars/`:

| File | Dimensions |
|------|-----------|
| `star-full@1x.png` | 48×48px |
| `star-full@2x.png` | 96×96px |
| `star-full@3x.png` | 144×144px |
| `star-partial@1x.png` | 48×48px |
| `star-partial@2x.png` | 96×96px |
| `star-partial@3x.png` | 144×144px |
| `star-ghost@1x.png` | 48×48px |
| `star-ghost@2x.png` | 96×96px |
| `star-ghost@3x.png` | 144×144px |
| `star-return@1x.png` | 48×48px |
| `star-return@2x.png` | 96×96px |
| `star-return@3x.png` | 144×144px |

Render logic:

| State | Asset | Size | Opacity | Tint |
|-------|-------|------|---------|------|
| Full day | `star-full` | 24pt | 0.9 | none |
| Partial day | `star-partial` | 18pt | 0.45 | none |
| Missed day | `star-ghost` | 12pt | 0.06 | none |
| Return day | `star-return` | 26pt | 0.9 | `#8fb0a4` |
| Future day | `star-ghost` (reused) | 10pt | 0.04 | none — hollow SVG outline if PNG not available |

**Asset fallback:** If PNG files are not present in `/assets/stars/`, render a four-point SVG star path at the matching opacity values above. Apply `#8fb0a4` tint to the return-day SVG. In code, set `STAR_PNGS_READY = true` in `components/galaxy/StarMark.tsx` once all 12 files are in place — the component switches from SVG to PNG automatically.

**Three zoom levels, toggled by tab:**
- **Week** — seven stars in a single row. Current week only. Large enough to feel significant.
- **Month** — 7-column grid. Days of the week labelled in faintest text above each column. Star density readable at a glance.
- **Year** — full 365-day grid. At this scale the stars become small marks and the texture of the year becomes visible — a nebula of presence.

**Stats beneath the galaxy:**
Three numbers only — days present, presence rate (%), current streak. Displayed in the personal serif typeface, not as achievement badges.

Presence rate is calculated as: days present ÷ total days elapsed since start date × 100. Rounds to nearest whole number. Does not include future days.

**The cosmic web line:**
> *"the cosmic web and a neural network look identical under a microscope. you're building both."*

---

## Home screen widgets (iOS / Android)

Two small widgets and one wide widget. All share the same design system as the app — dark background, same star marks, same typefaces.

**Note:** Widgets are scoped to Build Phase 2. The widget specifications are documented here so the data layer is designed correctly from the start, but widget surfaces are not required in v1.

### Small widget 1 — habit tick-off
- Shows today's habits as abbreviated single-line rows with tap-to-complete circles
- Habit names shortened to one or two words (e.g. "wake", "water", "walk", "breathe")
- Tapping completes the habit and updates the app's data in real time
- This is the primary friction-reducer — the user can log a habit without opening the app

### Small widget 2 — streak + week strip
- Large number in personal serif: the current streak count
- Subtitle beneath: "days present" — always this label, never "streak" or "combo"
- Below the number: a row of seven stars (Mon–Sun), labelled "this week" in faintest tracking text above
- **Empty state for future days:** an unfilled star outline at very low opacity (~0.08). The same star shape, just hollow. A placeholder, not a void.
- **Today's star:** slightly larger than past days, full opacity if complete, half opacity if partially complete, outline-only if not yet started

### Wide widget — galaxy month view
- Full-width widget showing the current month's galaxy grid
- Same star rendering as the in-app galaxy view
- No controls, no tabs — month view only
- Labelled "your galaxy" in personal serif at top left
- Tapping the widget opens the app to the full galaxy screen

---

## In-app screens

### 1. Home screen — daily check-in
- Status bar: date (left), phase label + settings icon ⚙ (right). Settings icon navigates to the profile screen. ≥44×44pt tap target, `accessibilityLabel: "settings"`.
- Greeting block: large serif — *"good morning, [Name]."* — name in italic
- Interoceptive prompt: *"one word — how does your body feel?"* — tap-to-type inline text field, visually minimal, never required. If entered, stored against today's date.
- **Presence block** — sits directly beneath the interoceptive prompt, above the week strip:
  - Days present count in Playfair Display 400 (same size as the greeting)
  - Label beneath: "days present" in Outfit 300, tertiary text colour
  - Sleep note beneath the label in tertiary text: *"to protect your [wake time], aim to be in bed by [calculated time]."*
  - No border, no card surface. Open layout, same horizontal padding as the greeting.
- Week strip: seven star marks (Mon–Sun) with day letters beneath. Today's star renders at 1.2× its state size.
- Habit groups: morning and evening, with time-aware opacity logic as described above
- Each habit row: habit name in Outfit 400 (secondary text colour) + 44pt minimum tap target circle on the right. A barely-visible 2pt tertiary-colour dot sits to the right of the name as a passive signal that science context lives in Learn. No second line of text.
- Completion state: circle fills, name colour shifts to muted teal, quiet tick appears. No animation fanfare.
- Bottom of screen ends with the last habit group. No persistent element at the very bottom — the navigation bar handles that zone.
- Navigation: three-item bottom nav — today / galaxy / learn

### 2. Galaxy screen
- Header: *"your"* then *"galaxy"* in italic personal serif on next line
- Subtitle: *"every star is a day you showed up"*
- Cosmic web line beneath subtitle
- Tab row: week / month — minimal, text only, active tab underlined in teal. (Year view is Build Phase 2.)
- **Safe area:** the star canvas container and tab row apply `paddingHorizontal: 20` plus the device's horizontal safe area inset via `useSafeAreaInsets()` from `react-native-safe-area-context`. This applies at all zoom levels. Do not clip the canvas to the screen edge.
- **Star canvas — MVP rendering (Build Phase 1):** Absolutely positioned `<Image>` components inside a `<View>` with `flexWrap`. No Skia, no SVG canvas, no Reanimated canvas. Week and month views are sufficient for Build Phase 1.
  - Each star gets a small deterministic x/y nudge seeded from its date string (±3pt, no external library). This makes the field read as organic without jitter between renders.
  - Week view: `flexDirection: 'row'`, `justifyContent: 'space-between'`. Month view: `flexDirection: 'row'`, `flexWrap: 'wrap'`, fixed cell width of `(screenWidth - insets - 40) / 7`, spacer Views for leading days.
  - Star sizes come from `STATE_CONFIG` in `StarMark.tsx` — not passed as props from the galaxy screen. No `isToday` applied in the galaxy view.
- Stats row beneath canvas: three numbers (days present / presence rate / streak)
- Navigation: same three-item bottom nav (today / galaxy / learn)

### 3. Fall-off re-entry screen
- Appears automatically on app open after 2+ consecutive days of no activity
- Replaces the home screen entirely until the user taps through
- Full-screen dark background
- Single word in very large personal serif italic: *"back."*
- One line beneath in faintest text: *"the door was always open"*
- One button: **"I'm back"** — pill-shaped, teal border, no fill. Tapping marks today as a return day, resets streak from 1, immediately shows today's habits.
- No explanation prompt. No guilt check-in. No "what happened" field.

### 4. Weekly reflection screen (Sunday only, optional)
Reflection appears on calendar Sundays — the actual day of the week, not a rolling 7-day interval. If the user starts on a Thursday, the first reflection prompt appears on Sunday three days in. This is intentional: the weekly rhythm matters more than the number of days elapsed.

Phase-gated — questions unlock progressively as the user moves through phases.

**Phase 1 (Weeks 1–3) — 3 questions:**
1. Did I show up more days than not?
2. How does my body feel compared to last Sunday?
3. What's one small thing I want to do differently this week?

**Phase 2 (Weeks 4–8) — adds 3 questions:**
4. What did I actually make, move forward, or complete?
5. What did I avoid — and what might I have been protecting myself from?
6. What did my body need that I didn't give it?

**Phase 3 (Weeks 9–13) — adds 2 questions:**
7. Am I building toward something, or managing my current circumstances?
8. What's the one thing that matters most next week?

At the top of each reflection, the week's morning body-check words are displayed:
> *"this is how you described yourself each morning: heavy · heavy · okay · lighter · okay · okay · okay"*

Days where the user skipped the body-check prompt display as "—" in this list. No analysis. No interpretation. Just a mirror.

Responses saved as private notes. No sharing. No analytics. Readable as a scrollable log.

### 5. Learn screen
Accessible from the bottom nav (third tab, replacing profile). Top-level screen — no back navigation required.

**Header:** "learn" in Playfair Display 400 italic, primary text colour.

**Two sections, separated by a single 1px `#1c1c1c` rule:**

**Section 1 — Your habits**
A scrollable list of the user's active habits. Each entry expands on tap (accordion). Collapsed: habit name in Outfit 400. Expanded reveals:
- **The reframe** — one line, Outfit 400, secondary text colour. Motivational. (e.g. *"this isn't a workout — it's a signal"*)
- **The science** — one short paragraph, Outfit 300, tertiary text colour (`#6b6660`). Mechanistic. (e.g. *"low-intensity morning movement resets cortisol rhythm..."*)

Only one row open at a time. Tapping an open row collapses it. 200ms opacity fade on expanded content (`prefers-reduced-motion`: fade only, no transform). Minimum 44pt tap target on each row header.

**Section 2 — This week**
A single card (dark surface `#141414`, 1px border `#1c1c1c`, 16px corner radius). Displays one neuroscience concept per week, phase-gated and sequenced. Refreshes on Monday of each week.

Card anatomy:
- Concept title in Playfair Display 400, primary text colour
- One-sentence definition in Outfit 300, secondary text colour
- 3–4 paragraph body in Outfit 300, secondary text colour, line height 1.6
- Footer in tertiary text: *"new concept in [N] days"*

Phase 1 concept sequence (weeks 1–3): circadian rhythm → cortisol awakening response → neuroplasticity. Full content in `app/(tabs)/learn.tsx`.

### 6. Profile screen
Accessible via the settings icon ⚙ in the top-right of the home screen status bar — **not** from the bottom nav. Low-frequency action; does not warrant a tab. Simple, functional, no headers. Three sections, visually separated by 1px borders only.

**Your anchors**
- Wake time — editable (opens time picker)
- Evening habit — editable (returns to the option tiles from onboarding)
- Notification times — three editable time pickers (same as onboarding Screen 9)

**Your reset**
- Start date — displayed, not editable
- Current phase — displayed as plain text (e.g. "phase 1 · stabilise · week 2")
- Phase unlock — if Phase 2 or 3 is pending user confirmation, the prompt appears here as a secondary option

**The fine print**
- "This app does not collect your data. Everything lives on your device."
- App version number in tertiary text

No reset option in v1. No account management. Nothing that adds cognitive load.

### 7. Phase progress screen
**Deprioritised for Build Phase 1.** Not required in v1. The phase label in the home screen status bar and the profile screen phase display provide sufficient orientation. Build Phase 2 item.

---

## Miss and fall-off logic — exact decision tree

This logic must be implemented precisely. The nuance is load-bearing.

**Day boundary:** A calendar day ends at 3:00am. Habit completions tapped between midnight and 3:00am count toward the previous calendar day. This protects users with disrupted sleep rhythms.

**After 1 missed day:**
- The next morning notification fires the never-miss-twice nudge copy: *"yesterday was yesterday. today just needs one thing."*
- On home screen, the habit list shows a subtle amber highlight on the habit rows — warm, not alarming. This is the only visual change.
- Nothing else changes. No modal, no prompt, no explanation.

**After 2 consecutive missed days:**
- On the next app open, the fall-off screen replaces the home screen entirely.
- The fall-off screen stays until the user taps "I'm back."
- The fall-off notification fires: *"still here. so are we. one tap when you're ready."*

**After 3+ consecutive missed days:**
- Same fall-off screen. No escalation. No different message. No different behaviour.
- The door is always the same door.

**Fall-off screen is triggered by app open, not by time or notification.** Notifications keep the line of contact warm. The screen change happens when the user returns.

**On tapping "I'm back":**
- Today is marked as a return day (star renders with teal tint, slightly larger)
- Streak resets to 1
- Home screen appears immediately with today's habits
- No confirmation, no summary, no "welcome back" message beyond the home screen greeting

---

## Notification copy

Warm and direct. Never nagging. Never gamified.

**Morning anchor (user's chosen wake time):**
> "[time]. same as yesterday. same as tomorrow."

**Movement reminder:**
> "have you moved yet? even ten minutes counts."

**Wind-down:**
> "wind down starts now. not later. now."

**Never-miss-twice nudge (morning after a missed day):**
> "yesterday was yesterday. today just needs one thing."

**Phase 2 unlock:**
> "[Name], three weeks. Phase 2 is ready when you are."

**Fall-off detection (2+ days no activity):**
> "still here. so are we. one tap when you're ready."

**Evening anchor reminder:**
> "[habit name]. just this. then the day is done."

---

## Design system

### Colour palette
- **Background:** #0c0c0c — near black, not pure black
- **Surface:** #141414 — subtle card separation if needed
- **Borders:** #1c1c1c — 0.5px only. Barely there.
- **Primary text:** #ede8e0 — warm off-white. Never pure white.
- **Secondary text:** #bab5ac — muted warm grey
- **Tertiary text:** `#6b6660` — `#6b6660` on `#0c0c0c` = ~4.6:1, passes WCAG AA. Used exclusively for the sleep note on the home screen and science text in the Learn accordion. Previous value `#383838` (~2.3:1) and interim `#6e6a63` are both superseded.
- **Teal (action / completion):** #3d6b58 for borders and fills, #8fb0a4 for active text and labels
- **Amber (nudge state):** #c4873a — used for never-miss-twice highlight. Warm, not alarming.
- **Coral (fall-off):** reserved — not used in v1

### Accessibility
All text must meet WCAG AA contrast ratio (4.5:1 minimum) against the background. Tertiary text (`#6b6660` on `#0c0c0c` = ~4.6:1) passes this threshold. Tertiary text is now used only for the sleep note (home screen) and the science text inside the Learn accordion — both low-frequency, low-size contexts. Confirm with a contrast checker before shipping.

Minimum tap target size: **44×44px** on every tappable element including habit rows, navigation items, and widget targets.

### Typography
Two typefaces only.

**Personal serif — Playfair Display**
Used for: greeting, streak number, galaxy title, "back." screen, phase names, any moment with emotional weight.
- Weight: 400 regular and italic only. Never bold.
- Italic reserved for user's name and galaxy title.
- Minimum size: 13px.

**Functional sans — Outfit**
Used for: all UI text. Habit names, micro-explanations, navigation labels, widget labels, notification copy, dates, status bar, onboarding body text.
- Weights: 300 (micro-explanations and tertiary labels), 400 (habit names, body text), 500 (active states)
- Minimum size: 11px. Nothing below this.

### Motion and feedback
- Habit completion: tap circle fills with quiet colour transition (250ms). Habit name shifts colour. No bounce, no confetti, no sound.
- Fall-off → home transition: simple fade. Nothing dramatic.
- Galaxy view tab change: canvas redraws in place. No animation.
- All motion must respect the user's "reduce motion" accessibility setting.

### What the app must never do
- Flash red anywhere
- Show a badge count on the app icon
- Use the word "streak" in a way that implies it can be broken
- Ask "what happened?" after a missed day or fall-off
- Celebrate with animation or sound
- Show a progress bar that implies a finish line
- Use push notifications that create anxiety

---

## Technical specification

### Framework
**Expo (React Native)**
- Target: iOS 16+ primary, Android 12+ secondary
- **Expo SDK 54** (current), React Native 0.81.5, React 19.1.0
- TypeScript throughout
- New Architecture enabled (`newArchEnabled: true` in app.json)

### Local storage
**Storage strategy — two modes:**

**Expo Go / development testing:** `@react-native-async-storage/async-storage` with an in-memory cache layer (`lib/storage.ts`). On app startup, `initStorage()` pre-loads all persisted data into a synchronous in-memory object (`memCache`). All reads are synchronous against this cache; writes go to the cache immediately and persist to AsyncStorage asynchronously in the background. This preserves the synchronous API used throughout the codebase with no changes required to screen files.

**Native builds (EAS / TestFlight / production):** `react-native-mmkv` — faster, truly synchronous, suitable for frequent habit log writes. The `storage` object in `lib/storage.ts` should be replaced with the MMKV implementation when building natively. The API shape is identical — `getString`, `set`, `getBoolean`, `remove`, `getAllKeys` — so only the storage layer file changes.

All data is stored locally on-device. No account required to start.

Persistent storage keys and structure:

```json
{
  "user": {
    "name": "string",
    "startDate": "YYYY-MM-DD",
    "currentPhase": 1,
    "phaseUnlockState": "active | pending | dismissed",
    "wakeTime": "HH:MM",
    "movementType": "string",
    "breathworkExperience": "yes | no",
    "breathworkPractice": "string | null",
    "eveningHabitType": "reading | phone-off | breathwork | journalling | custom",
    "eveningHabitLabel": "string",
    "projectName": "string | null",
    "notificationTimes": {
      "morning": "HH:MM",
      "movement": "HH:MM",
      "windDown": "HH:MM"
    },
    "startingMood": "string"
  },
  "habits": {
    "habit_[uuid]": {
      "id": "habit_[uuid]",
      "label": "string",
      "microExplanation": "string | null",
      "phase": 1,
      "group": "morning",
      "locked": false,
      "isCustom": false,
      "suggestedId": "string | null",
      "active": true,
      "createdAt": "ISO timestamp"
    }
  },
  "habitLog": {
    "YYYY-MM-DD": {
      "habits": {
        "habit_[uuid]": true
      },
      "bodyCheckWord": "string | null",
      "isReturnDay": true | false,
      "dayBoundaryApplied": true | false
    }
  },
  "streakData": {
    "currentStreak": 0,
    "lastPresentDay": "YYYY-MM-DD | null"
  },
  "weeklyReflections": {
    "YYYY-MM-DD": {
      "answers": ["string", "string", "string"]
    }
  }
}
```

### Habit model — locked vs. replaceable

Habits are not a fixed enum. They are user-owned records stored in a `habits` collection. Each habit has an ID generated at creation, a label, a phase, a group (morning or evening), and a `locked` flag.

**Locked habits** cannot be removed or renamed. They are physiologically non-negotiable — the protocol depends on them. Two habits are locked:
- `wake-anchor` — the circadian anchor for everything else
- `water-before-coffee` — cortisol regulation at wake

**Replaceable habits** are suggested by the app but can be swapped for a user-defined custom habit at any time. The suggestion appears first; the user can tap "use something else" to replace it with free text. The replacement inherits the same phase, group, and presence weighting as the habit it replaced. Suggested replaceable habits:
- `morning-movement` *(Phase 1, morning)*
- `nervous-system-reset` *(Phase 1, morning)*
- `evening-anchor` *(Phase 1, evening — already personalised in onboarding)*
- `consistent-bedtime` *(Phase 2, evening)*
- `breakfast` *(Phase 2, morning)*
- `morning-pages` *(Phase 2, morning)*
- `phone-off-reading` *(Phase 2, evening)*
- `project-hour` *(Phase 2, morning)*
- `diet-anchor` *(Phase 3, morning)*
- `protected-sleep` *(Phase 3, evening)*
- `project-output` *(Phase 3, morning)*

**Custom habits** can also be added by the user on top of suggested habits, up to a maximum of 2 additional habits per phase. Custom habits are assigned to morning or evening group by the user. They count toward the presence threshold equally.

**Habit record schema:**

```json
{
  "habits": {
    "habit_[uuid]": {
      "id": "habit_[uuid]",
      "label": "string",
      "microExplanation": "string | null",
      "phase": 1 | 2 | 3,
      "group": "morning" | "evening",
      "locked": true | false,
      "isCustom": true | false,
      "suggestedId": "string | null",
      "active": true | false,
      "createdAt": "ISO timestamp"
    }
  }
}
```

`suggestedId` stores the original suggestion key (e.g. `morning-movement`) so the app can reference the default micro-explanation if the user hasn't written their own. If the user writes a custom label, `microExplanation` can be left null — the habit row simply renders without a micro-explanation line, which is fine.

The habit log keys off `habit_[uuid]` — not a fixed string — so the log remains valid regardless of what the user has customised.

### Notifications
**Expo Notifications** (`expo-notifications`)
- Three editable anchor alarms, set in onboarding, adjustable in profile
- All notifications are local — no push infrastructure required in v1
- Notification content is defined in the Notification copy section above
- Never-miss-twice nudge is triggered by detecting a missed day at the morning notification fire time
- Fall-off notification (2+ days) fires at the same morning anchor time

### Day boundary
A calendar day ends at 3:00am. Habit completions between midnight and 3:00am are written to the previous calendar day's log entry. Store the applied date explicitly in the log entry (`dayBoundaryApplied: true`) so it can be debugged.

### Presence and streak calculation
- **Present day:** habits complete ≥ majority of active habits for the current phase. Majority = `Math.ceil(activeHabits.length / 2)`. Calculated dynamically against whatever habits the user has active — suggested, replaced, or custom — so the threshold flexes correctly if the user has added or removed habits.
- **Streak:** consecutive present days up to and including today. If today is not yet complete, streak shows the count through yesterday.
- **Presence rate:** `(days present since start) / (days elapsed since start) * 100`, rounded to nearest integer. Does not include future days.

### Phase unlock
Phase unlock state is stored locally and is user-confirmed — never automatic. The prompt surfaces at the start of Week 4 (Phase 2) and Week 9 (Phase 3). "Give me one more week" defers by 7 days. "I'll decide later" dismisses and makes the prompt accessible from the profile screen.

### Time-aware UI
Evening habit group opacity is driven by comparing current time to the user's stored wind-down notification time. Below wind-down time: 30% opacity. At or after wind-down time: 100% opacity. Check on app foreground and every 5 minutes while app is active.

### Optional cloud sync
Not required for v1. Design the local storage schema with sync in mind — flat key-value structure with timestamps will make this straightforward to add later.

---

## Build phases

### Build Phase 1 — Core ✅ COMPLETE (v5 design amendments applied)

**Built and working:**
- ✅ Onboarding — all 12 screens (`app/onboarding/`)
- ✅ Home screen — habit groups, time-aware evening opacity, body-check prompt, **presence block** (days present + sleep note, above week strip), week strip, Sunday reflection banner, settings icon navigating to profile (`app/(tabs)/index.tsx`)
- ✅ Habit rows — name only (no micro-explanation), 2pt learn dot affordance, 44pt tap target (`components/habits/HabitRow.tsx`)
- ✅ Habit completion with 3am day boundary logic (`lib/dayBoundary.ts`)
- ✅ Galaxy screen — week and month views, `useSafeAreaInsets()` on canvas, deterministic star offsets, state-canonical star sizes (`app/(tabs)/galaxy.tsx`)
- ✅ Star sizing — explicit pt sizes per state in `STATE_CONFIG`, `isToday` 1.2× multiplier for week strip only (`components/galaxy/StarMark.tsx`)
- ✅ Fall-off detection and re-entry screen (`app/falloff.tsx`, `lib/presence.ts`)
- ✅ Never-miss-twice nudge — notification scheduled + amber highlight prop passed to `HabitRow`
- ✅ Weekly reflection screen — Sunday-keyed, Phase 1 questions, body-check word mirror (`app/reflection.tsx`)
- ✅ **Learn screen** — habit accordion (one-at-a-time, 200ms fade), weekly neuroscience concept card, phase-sequenced concept library weeks 1–3 (`app/(tabs)/learn.tsx`)
- ✅ **Bottom nav: today / galaxy / learn** — profile moved to settings icon on home screen
- ✅ Profile screen — wake time, evening habit, notification times, phase display, fine print — accessible via ⚙ icon (`app/(tabs)/profile.tsx`)
- ✅ Local notifications — morning anchor, movement, wind-down, never-miss-twice nudge, fall-off (`lib/notifications.ts`)
- ✅ Phase 1 habits and presence logic (`lib/habits.ts`, `lib/presence.ts`)
- ✅ Full storage schema (`lib/storage.ts`) — AsyncStorage-backed in-memory cache for Expo Go; MMKV for native builds
- ✅ Phase 2 and 3 habit IDs + micro-explanations defined in `lib/habits.ts` (schema-ready, UI not yet surfaced)

**Known minor gaps (Build Phase 1 items to tighten up):**
- `scheduleFallOffNotification()` is defined in `lib/notifications.ts` but not yet called from the home screen — the fall-off redirect happens but the next-day notification is not scheduled at that point
- `scheduleEveningNotification()` (personalised evening anchor copy: "[habit name]. just this. then the day is done.") is defined but not called from `scheduleAllNotifications()` — the wind-down notification fires with the generic "wind down starts now" copy instead
- Phase label in the home screen status bar is currently hardcoded as `"phase 1 · stabilise"` — needs to read from `user.currentPhase` dynamically when Phase 2/3 UI is built
- Profile screen evening habit editor shows only the 4 preset options (reading / phone-off / breathwork / journalling) — no free-text "something else" option matching onboarding Screen 8

**Not in Build Phase 1 (confirmed deferred):**
- Phase 2 and Phase 3 habit unlock prompts and UI
- Phase unlock prompts (store the state, surface the prompt in Build Phase 2)
- Galaxy year view
- Widgets
- Phase progress screen
- Android widget support

**Definition of done for Build Phase 1 (met):**
A user can complete onboarding, log habits across multiple days, see their week strip update, experience the fall-off screen after inactivity, return via "I'm back", complete a Sunday reflection, and see their streak and presence rate in the galaxy screen. All data persists across app closes and device restarts.

---

### Build Phase 2 — Complete the experience
**Scope:**
- Phase 2 habit unlock flow and all Phase 2 habits
- Phase 3 habit unlock flow and all Phase 3 habits
- Galaxy year view
- Home screen widgets (iOS first: habit tick-off widget, streak + week strip widget, wide galaxy widget)
- Phase progress screen
- Weekly reflection Phase 2 and Phase 3 questions
- Android widget support (after iOS widgets are stable)
- Optional cloud sync / backup

---

## What this app is not

- Not a to-do list
- Not a productivity suite
- Not a mood tracker with graphs and analytics
- Not a journalling app
- Not competitive or social
- Not something that adds pressure — every design decision should reduce it
- Not a clinical tool — it does not diagnose, assess risk, or replace professional support

---

## The one thing to remember when building this

The person using this app has executive dysfunction. The moment between *"I should open the app"* and *"I opened the app and logged something"* is where the system fails. Every tap, every navigation step, every field that requires input is friction. Build to eliminate friction first, features second.

The best version of this app is the one that requires the least from the user while giving them the clearest possible signal that they showed up today.

The onboarding is the one exception to the friction rule — it is allowed to take a few minutes, because it is doing therapeutic work. The user leaving onboarding should feel: *this was built for someone like me.*

Every other interaction after that should feel like almost nothing.

---

*Build prompt v5 — reflects current built state as of 2026-05-04. Changes from v4: Expo SDK updated to 54 (React Native 0.81.5, React 19.1.0, New Architecture enabled); storage section updated to document two-mode strategy (AsyncStorage + in-memory cache for Expo Go, MMKV for native builds); Build Phase 1 marked complete.*

*Design amendments v4 → v5 (applied 2026-05-04): tertiary text corrected to `#6b6660` (WCAG AA); galaxy canvas safe area insets specified (`useSafeAreaInsets()` + 20pt); presence block (days present + sleep note) repositioned above week strip; star sizing made explicit per state (24/18/12/26/10pt) with `isToday` 1.2× multiplier for week strip only; micro-explanations removed from habit rows (2pt dot affordance added); Learn tab added to bottom nav replacing profile; profile moved to settings icon ⚙ on home screen; Learn screen fully built with habit accordion and weekly concept card; galaxy MVP rendering spec applied (deterministic offset, no Skia, state-canonical sizes).*
