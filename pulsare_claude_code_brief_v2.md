# Pulsare — Claude Code Brief v2
## Amendments & New Features

Apply these changes on top of the existing build. Do not rewrite what's working. Patch only what's referenced below.

---

## UI Amendments

### UI 1 — Time-sensitive greeting

**Current behaviour:** The home screen greeting always reads *"good morning, [Name]."* regardless of the time of day.

**Amendment:** The greeting must reflect the actual time of day. Use the following time bands:

| Time | Greeting |
|------|----------|
| 5:00am – 11:59am | *"good morning, [Name]."* |
| 12:00pm – 4:59pm | *"good afternoon, [Name]."* |
| 5:00pm – 8:59pm | *"good evening, [Name]."* |
| 9:00pm – 4:59am | *"still up, [Name]."* |

The late-night variant (*"still up"*) matches the tone of the rest of the app — warm, non-judgmental, not alarmed that someone is awake at midnight.

The greeting re-evaluates on every app foreground event, not just on first open. If the user leaves the app in the morning and returns in the afternoon, the greeting updates.

**AI-generated greeting variations (Feature 3 in the existing brief)** must produce five variations per time band, not just one set. The existing prompt in Feature 3 should be updated to request `greetingVariations` as an object keyed by time band:

```json
"greetingVariations": {
  "morning": ["string", "string", "string", "string", "string"],
  "afternoon": ["string", "string", "string", "string", "string"],
  "evening": ["string", "string", "string", "string", "string"],
  "latenight": ["string", "string", "string", "string", "string"]
}
```

Fallback if personalised copy hasn't generated: use the defaults from the table above. Never show an empty greeting.

---

### UI 2 — Rename "wake anchor" to "wake up alarm"

**Current behaviour:** The habit is labelled "wake anchor" throughout the app.

**Amendment:** Replace every instance of "wake anchor" with "wake up alarm" — home screen habit row, Learn screen accordion, onboarding screens, notification copy, MMKV storage label, and the AI copy generation prompt in Feature 3 of the existing brief.

The `suggestedId` key in the habit model remains `wake-anchor` internally for data continuity. Only the display label changes.

Update the morning notification copy to match:
> *"[time]. same as yesterday. same as tomorrow."*
This copy remains unchanged — it doesn't reference the habit name directly, so no edit needed there. Audit any other notification or micro-copy strings that reference the habit name by label and update accordingly.

---

## New Features

### FEATURE 5 — Custom habit: add during onboarding and post-onboarding

**What this is:** The user can add one additional personal habit during onboarding, and can also add or remove it at any time after onboarding from the home screen or profile. The habit slots into whatever phase the user is currently in — it is not phase-locked.

---

#### Part A — Onboarding screen (new screen, insert after Screen 8)

Insert a new screen between Screen 8 (evening anchor) and Screen 9 (notification times). It becomes the new Screen 9. All subsequent screens shift up by one number.

**Screen 9 — Your own habit (optional)**

> *"is there something else you want to hold yourself to?"*

Subtext beneath in tertiary text:
> *"this is yours to define. it doesn't need to be big."*

Two-part input on this screen:

1. **Free text field** — habit name. Placeholder in light grey: *"e.g. no alcohol, call someone, get outside"*. Max 40 characters. Optional — if left blank, no custom habit is created and the screen advances normally.

2. **Time of day toggle** — appears only after the user starts typing in the text field. Two pill buttons side by side:
   - **morning** (default selected)
   - **evening**

   This determines which habit group the habit appears in on the home screen. No further configuration. No notification prompt — this habit does not get a dedicated notification in v1.

Single button at the bottom: **"add it"** if a name has been entered, **"skip for now"** if the field is empty. Both advance to the next screen.

If added, the habit is created in the `habits` collection with:
- `label`: the user's entered text
- `userLabel`: same as label (it's already theirs)
- `phase`: user's current phase at time of creation
- `group`: their chosen time of day
- `locked`: false
- `isCustom`: true
- `suggestedId`: null
- `microExplanation`: null (no Learn accordion entry — this is the user's own habit, not the protocol's)

The habit appears on the home screen immediately, in the correct group, alongside the protocol habits. It counts toward the presence threshold equally.

---

#### Part B — Post-onboarding: add from home screen

A small add button sits at the bottom of the morning habit group and the bottom of the evening habit group on the home screen — only if the user has fewer than 2 custom habits active in that phase. It is the faintest possible affordance: a `+` in tertiary text colour, no border, no label. Tapping it opens a bottom sheet with the same two-part input as the onboarding screen above (text field + morning/evening toggle, pre-selected to the group they tapped from).

The bottom sheet has a single confirm button: **"add habit"**. Dismisses on tap outside or on a swipe down.

The `+` affordance is hidden once the user has 2 custom habits in their current phase (the existing cap from the v4 spec). It reappears if a custom habit is removed.

---

#### Part C — Remove a custom habit

Custom habits (and only custom habits — locked habits cannot be removed) show a remove affordance on long press. A long press on any custom habit row on the home screen reveals a subtle contextual option — not a destructive red button, just a quiet line of text beneath the habit name:

> *"remove this habit"*

In tertiary text colour. Tapping it shows a single confirmation: *"remove [habit name]?"* with two options — **"yes, remove it"** and **"keep it"**. On confirm, the habit is marked `active: false` in MMKV. It no longer appears on the home screen. Historical log entries that reference the habit ID remain unchanged — the galaxy record is not retroactively altered.

The same remove flow is accessible from the profile screen under "your anchors" — custom habits listed there with a remove option inline.

---

### FEATURE 6 — Phase explainer pop-up

**What this is:** Tapping the phase label in the home screen status bar (*"phase 1 · stabilise"*) opens a modal that explains all three phases — what they are, what they add, and approximately when they arrive. The user can see the full shape of the protocol from day one.

---

#### Trigger

The phase label in the top-right of the home screen status bar is tappable. It must have a minimum tap target of 44×44pt — expand the invisible tap area around the label text if needed. A barely-visible underline dot (2pt, tertiary colour) beneath the label signals that it's interactive, consistent with the Learn screen habit affordance dot.

---

#### Modal spec

Full-screen modal. Dark background (`#0c0c0c`). Slides up from the bottom. Dismisses on swipe down or tap of a close target (a small `×` in the top right at tertiary text colour, 44×44pt tap target).

**Header:**
> *"the shape of your reset"*

In Playfair Display 400 italic. Primary text colour. Generous top padding.

**Subtext beneath header:**
> *"three phases. thirteen weeks. each one builds on the last."*

Outfit 300. Secondary text colour.

---

**Three phase cards, stacked vertically with 16pt gap between:**

Each card: surface `#141414`, 1px border `#1c1c1c`, 16px corner radius, 20pt internal padding.

**Card anatomy:**

- Phase number + name in Outfit 500, teal label colour (`#8fb0a4`) if this is the current phase, secondary text colour (`#bab5ac`) if upcoming, tertiary colour if not yet unlocked — e.g. *"phase 1 · stabilise"*
- Week range in Outfit 300, tertiary text colour — e.g. *"weeks 1–3"*
- One-sentence description in Outfit 400, secondary text colour
- Habit list: each habit on its own line, Outfit 300, tertiary text colour, preceded by a hairline dash — *"— wake up alarm"*, *"— water before coffee"*, etc.
- For Phase 2 and 3: habits are listed but the card carries a subtle *"unlocks at week 4"* / *"unlocks at week 9"* label in the bottom right corner of the card. Outfit 300. Tertiary text colour.

**Current phase card** is visually elevated: 1px border in teal (`#3d6b58`) instead of `#1c1c1c`. A *"you are here"* label sits in the top-right of the card in Outfit 300, teal label colour.

---

**Phase card content:**

| Phase | Name | Weeks | Description |
|-------|------|-------|-------------|
| 1 | stabilise | 1–3 | *"the foundation. five anchors that regulate your nervous system before anything else is added."* |
| 2 | build | 4–8 | *"consistency earns complexity. five new habits, added to what you've already built."* |
| 3 | raise the stakes | 9–13 | *"protect what works. three more anchors — diet, sleep as infrastructure, and deeper project time."* |

Habit lists per phase use the user's personalised labels where they exist (e.g. their chosen movement type, their evening anchor label, their project name).

---

**Footer of modal:**

In faintest tertiary text, centred:
> *"phases unlock when you're ready — not on a timer."*

This is a reassurance, not a feature description. It sits beneath the last card with generous padding before the bottom of the modal.

---

### FEATURE 7 — Developer mode: retroactive start date

**What this is:** A hidden testing mode that allows the start date to be set to a date in the past. This is for development and QA only — it must not be discoverable by a regular user.

---

#### Trigger

On the profile screen, the app version number sits in the tertiary text at the bottom of the screen (existing spec). Tapping the version number **five times in quick succession** (within 2 seconds) activates developer mode for the current session only.

On the fifth tap, a brief one-line toast appears at the bottom of the screen — above the nav bar, in amber (`#c4873a`), Outfit 300:
> *"developer mode on"*

Disappears after 2 seconds. No other visual change.

---

#### What developer mode unlocks

Developer mode adds a new section to the profile screen, inserted above "the fine print" section. It appears only while developer mode is active for that session. Section label: *"dev tools"* in Outfit 500, amber colour.

**Options in this section:**

**1. Set start date**
Tapping opens a date picker. The picker allows selection of any date up to and including today — past dates are allowed, future dates are not. On confirm, the stored `startDate` in MMKV is overwritten with the selected date.

Immediately recalculates:
- Current week number (based on new start date)
- Current phase (based on week number — respects user-confirmed unlock state; does not auto-unlock phases)
- Streak and presence rate (recalculated against the habit log — only logs days that actually have habit completions will count as present days; the app does not fabricate history)
- Galaxy view (re-renders with the new date range; days before any habit completions exist will render as missed/ghost stars)

The home screen phase label and week strip update immediately on return from the profile screen.

**2. Reset all data**
A single destructive option. Label: *"reset everything"* in Outfit 400, tertiary text colour (not red — no red anywhere). Tapping shows a confirmation: *"this will delete all data and restart onboarding. are you sure?"* with **"yes, reset"** and **"cancel"**. On confirm, clears all MMKV keys and navigates to the onboarding welcome screen.

**3. Phase override**
A three-option segmented control: Phase 1 / Phase 2 / Phase 3. Forces the app to render as if the user is in the selected phase, regardless of their start date or unlock state. Useful for testing Phase 2 and 3 habit UI without waiting. This is a display override only — it does not write to the phase unlock state in MMKV. Persists only for the current session.

---

#### Developer mode persistence

Developer mode is session-only. It does not persist across app closes. Every new session starts with developer mode off. This ensures it is never accidentally left on.

---

## Pre-delivery checklist (additions to existing checklist)

- [ ] Greeting updates correctly on app foreground — test by backgrounding at 11:55am and returning after 12:00pm
- [ ] "still up" greeting fires correctly between 9:00pm and 4:59am — does not show during daytime
- [ ] "wake up alarm" label appears everywhere "wake anchor" previously appeared — no instances of the old label remain in the UI
- [ ] Internal `suggestedId` key remains `wake-anchor` — data layer unchanged, display label only
- [ ] Custom habit onboarding screen appears between evening anchor and notification screens
- [ ] Skipping the custom habit screen leaves no habit record in MMKV
- [ ] `+` affordance on home screen is hidden when 2 custom habits already exist in the current phase
- [ ] Long press on custom habit row surfaces remove option — does not appear on locked habits (`wake-anchor`, `water-before-coffee`)
- [ ] Removing a custom habit marks it `active: false` — historical log entries are not altered
- [ ] Phase explainer modal slides up on tap of phase label — phase label tap target is ≥44×44pt
- [ ] Current phase card has teal border, *"you are here"* label — upcoming phases are visually quieter
- [ ] Phase card habit lists use the user's personalised labels, not the default suggested IDs
- [ ] Phase explainer modal dismisses on swipe down and on `×` tap
- [ ] Developer mode activates only on five taps within 2 seconds — single taps do nothing
- [ ] Developer mode is session-only — relaunch the app and confirm the dev tools section is gone
- [ ] Retroactive start date recalculates week number, phase label, streak, and galaxy view correctly
- [ ] Phase override in dev tools is display-only — MMKV phase unlock state is not modified
- [ ] Reset all data clears MMKV fully and navigates to onboarding welcome screen
