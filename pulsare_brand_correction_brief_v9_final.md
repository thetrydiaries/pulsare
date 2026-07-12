# Pulsare — Brand Correction & Galaxy Brief v9 (FINAL)

**Supersedes v6–v8.** For Claude Code. All decisions are locked — nothing in here is open. Plan-then-sign-off is still required for two items: the onboarding rewrite (1.4) and the galaxy build (Phase 2). Everything else is patch-in-place. Do not rewrite what works.

This corrects the drift from the `Huberman × 75 Hard` commit (`4973643`). The mechanics from that commit stay: 21-day cycles, phase-appropriate habit timing, the 4-of-6 slack rule, never-miss-twice, the day-21 review. What changes: framing, naming, output-tracking, onboarding weight, a legacy-system conflict found in final review, and a galaxy treatment that makes the north star native to the sky.

---

## Guardrails (resolve every judgment call toward these)

1. **Track presence, never output.** A day you showed up counts. No outcome is scored.
2. **Brain you have, not the brain you want.** Reduce initiation cost. Fewer decisions before the first action.
3. **Calm, warm, non-judgmental. Never loud, never gamified into pressure.**
4. **Science surfaced briefly, contextually — never as a lecture.** Depth lives in Learn, opt-in.
5. **The voice is ours.** No borrowed influencer or challenge branding, ever.
6. **Scientifically accurate where possible.** An honest, softer claim beats a punchy, overstated one.

---

## TIER 0 — Prevent recurrence: bake the guardrails into CLAUDE.md ★ new in v9

**Root cause, not symptom.** The Huberman × 75 Hard drift shipped *through* a Claude Code session — and `CLAUDE.md` currently contains workflow rules (deploy ritual, SW cache, UI-plan-first) but **zero brand or product-philosophy rules**. Any future session can drift the same way.

Add a short **"product guardrails"** section to `CLAUDE.md` containing the six guardrails at the top of this brief, plus two hard rules:
- *Never introduce named influencer/challenge branding (Huberman, 75 Hard, Atomic Habits, etc.) into user-facing copy. The science is stated in our own voice.*
- *Never add outcome/number tracking. Pulsare tracks presence. If a feature scores an outcome, it's out of brand — flag it instead of building it.*

Do this **first** — it's five minutes and it protects every subsequent step in this brief from being undone later. `CLAUDE.md` already declares itself the winner on conflicts with older docs, so this is the right home.

---

## TIER 1 — Brand correction (patch-in-place)

### 1.1 — Strip all "Huberman" and "75 Hard" from user-facing copy
Zero named references in anything the user reads. The neuroscience stays; the names go.

| File | Current | Change to |
|---|---|---|
| `lib/concepts.ts` (`phase-1-vs-phase-2`) | *"Andrew Huberman describes the day in phases…"* | *"Your day splits into phases set by your body's neurochemistry. Phase 1 is the first 0–8 hours after waking…"* |
| `app/(tabs)/learn.tsx` (`nsdr`) | *"…the highest-leverage rest intervention Huberman recommends."* | *"…one of the highest-leverage rest interventions available."* |
| Any other named-person copy | — | Neutralise. Mechanism, not messenger. |

**Internal hygiene (same pass):** `initHubermanHabits` → `seedHabits`; strip "Huberman × 75 Hard" from `lib/cycle.ts` header and `// Huberman:` comments. Keep all data-model keys stable (same continuity approach as `wake-anchor`).

### 1.2 — Retire the 75-day container (keep the 21-day cycle)
Cycles run indefinitely; after three cycles the app is in *integration* (already described in `concepts.ts`). The 75-day arc is the last structural bone of 75 Hard and doesn't match the math (3 × 21 = 63).
- `lib/cycle.ts`: remove `PROGRAM_LENGTH` and `isProgramComplete`.
- `app/(tabs)/index.tsx` (~line 372): delete the `day {programDay} of {PROGRAM_LENGTH}` sub-line. One indicator: `cycle N · day D of 21`.
- `app/onboarding/handoff.tsx`: stop setting `programLength`.
- Keep `user.programLength` readable for back-compat; stop writing/showing 75.

### 1.3 — Fix the day-21 milestone (accuracy)
`MILESTONE_FALLBACKS.day21` in `index.tsx` (*"three weeks. that's neuroplasticity."*) contradicts the app's own `concepts.ts`, which correctly says 21 days is not when a habit forms. Rewrite to the honest framing, e.g. *"three weeks. now we see what your body kept."* Align the AI milestone-copy prompt in `lib/personalisedCopy.ts` so generated day-21 greetings can't reintroduce the myth.

### 1.4 — Radically simplify onboarding `[plan → sign-off → build]`
Strip the front-loaded picker and jargon from `app/onboarding/habits.tsx`. The depth Shirley loves (BDNF, cortisol windows, cycle theory) moves to Learn — not the first five minutes.

- **Pre-select the six defaults** (the four `suggested: true` morning + two `suggested: true` evening in `habits.tsx`). No picking. Replace the screen with a warm confirm: *"here's your starting stack. nothing's locked — you can change any of it later."* + a quiet *"not for you? swap after you start."* One button: *"looks right."*
- **Delete the `ExplainLine` jargon block** from onboarding. It belongs in Learn.
- **Defer** "why this one?" rationales, phase windows, and the 21-day explainer to post-onboarding (Learn / first galaxy visit / day-appropriate reveal).
- The 4-of-6 rule keeps its one warm line on handoff (already there) and is taught in Learn.
- Re-check `PipIndicator total={7}` counts.

Flow: welcome → name → wake time → north star → confirm stack → notifications → handoff. Show the confirm-screen copy for sign-off before building.

---

## TIER 1.5 — North star (was capstone): direction, not measurement

**Locked: the season goal stays, all numeric tracking goes, and there is no recurring check-in.** The reflection is already baked into the day-21 cycle review — a second weekly prompt would just be the app quietly asking "are you on track?"

**Rename** every user-facing "capstone" → "north star." Keep internal `capstone` storage keys for continuity. Display-string files: `app/onboarding/capstone.tsx`, `app/(tabs)/index.tsx` (strip), `app/(tabs)/galaxy.tsx`, `lib/concepts.ts` (`capstone-vs-habit` → `north-star-vs-habit`, and rewrite its body to drop the "measures direction" framing — the north star gives the anchors a *why*, it isn't a gauge).

**Delete the weight machinery and the check-in entirely (net code removal):**
- `app/onboarding/capstone.tsx`: delete the `inferIsWeight` branch, unit pills, start/target fields. Screen = question + one free-text line + reframed micro. Keep *"what are you building toward?"*
- `types/index.ts`: `Capstone` becomes `{ goal: string }` (or leave old fields optional-and-unread).
- **Delete `components/CapstoneCheckInSheet.tsx`** and its imports/state in `index.tsx` and `galaxy.tsx`. Delete `getSundayOfWeek` from `lib/cycle.ts` (its only caller). Remove the capstone log storage reads (`getCapstoneLog`, `getLatestCapstoneEntry`) or leave them unread.
- `galaxy.tsx`: remove the `capstone` tab and `CapstonePane` — the north star moves into the sky (Phase 2).
- Home strip: keep a quiet north-star line under the status row, but it's **static text** now (no tap-to-log). Once Phase 2 ships, tapping it can simply open the galaxy.
- **Editability:** with the sheet gone, the goal text needs one home — add "north star" as an editable text field in `app/(tabs)/profile.tsx`. Seasons change; she can rewrite it there.

**Copy reframe:**
- Subtitle → *"your north star for this season. the one thing these anchors point toward."*
- Closing micro → *"your north star is the direction. the anchors are the daily work that points there. we track presence — showing up is the whole job. the north star just tells you why."*

**Migration:** old stored `capstone` objects may carry `startValue`/`type`/weekly log entries. Read `goal` only; ignore and never crash on the rest.

---

## TIER 1.6 — Retire the legacy phase-unlock system ★ new in final pass

**Finding:** two progression systems are running at once and they collide. The old phase 1→2→3 engine (`lib/progression.ts`: `PHASE2_DAY = 8`, `PHASE3_DAY = 22`) still fires full-screen `/unlock` takeovers from the home screen (`getPendingUnlock` → `router.replace('/unlock')`) that **add more habits** — while the new cycle model says six habits, reviewed and swapped at day 21. A new user hits the day-21 cycle review and then, the very next day, a full-screen "phase 3" offering extra habits. That's a direct contradiction (more checkboxes for a foggy brain is the audit's #1 failure mode) and a jarring double-beat.

**Fix — the cycle review IS the progression now:**
- Remove the phase 2/3 unlock path: `getPendingUnlock`, `acceptPhaseUnlock`, `deferPhaseUnlock` in `progression.ts`; the `/unlock` route (`app/unlock.tsx`); the `getPendingUnlock` redirect in `index.tsx`; `getPhaseCandidates` + `instantiatePhaseHabit` in `lib/habits.ts` if nothing else uses them.
- **Keep** the rest of `progression.ts` — it's on-brand and unrelated: week-1 gradual reveal, project tease (day 15), galaxy deepening milestones (m7/m14/m21/m30). Only the phase-unlock arm goes.
- Legacy `currentPhase` / `phaseUnlockState` fields: stop writing, leave readable (the "back-compat until Step 10" comment in `handoff.tsx` — this is Step 10).
- If habit *additions* between reviews are wanted later, the existing "+" on home already covers it (user-initiated, capped) — no system needs to push them.
- Same-pass naming cleanup: the legacy `phase?` arg on `getActiveHabits`, and `PHASE1_QUESTIONS` in `app/reflection.tsx` (rename to `REFLECTION_QUESTIONS`; the Sunday reflection itself stays — it's original brand).

### 1.7 — Re-pace Learn concepts to cycles ★ new in final pass
`lib/concepts.ts` still maps concepts by **week number** via `getConceptForWeek` — the comment itself says it's a bridge "until cycle-based logic lands (Step 7)." Land it: pace the 9 concepts across the 21-day cycle arc instead (e.g. unlock ~2 per week within a cycle, with `identity-based-habits` reserved for cycle 2+). Concepts revealed should track where she actually is in the cycle, not a parallel week counter. Remove the bridge helper once callers are migrated. Same-family leftover: `getCurrentTechnique` in `index.tsx` paces breathwork techniques by week number too — align it to cycle days in the same pass (or leave with a comment marking it intentional).

### 1.8 — Update the stale AI-generation prompts ★ new in v9
**Finding:** the server-side prompts in `api/generate-copy.ts` still describe the *old five-habit* app, so generated copy silently contradicts the shipped product — and will keep re-introducing stale framing even after every string in the client is fixed:
- `buildPersonalisedPrompt` requests `habitExplanations`/`completionAcknowledgements` for exactly five IDs (`wake-anchor`, `water-before-coffee`, `morning-movement`, `nervous-system-reset`, `evening-anchor`). The six newer habits (`morning-light`, `breakfast`, `calorie-log`, `evening-journal`, `phone-off-reading`, `nsdr`) get **no personalised copy at all**, and `water-before-coffee` copy will be written about *drinking water* while the habit's label is now *"delay caffeine 90 min."*
- The prompt doesn't know which six habits the user actually picked, or their north star. Pass `selectedHabits` (ids + current labels) and the north-star goal in the request body, and generate explanations/acknowledgements for *those*.
- Encode the day-21 truth in the milestone rule so generated greetings can't reintroduce the myth: day 21 = *"we now see what stuck"*, never *"habit formed."* (Mirrors 1.3.)
- Add the accuracy rule from 3.1 to **both** prompts: *"never state specific quantified effects (minutes, percentages) — describe mechanisms qualitatively."*
- `buildHabitLearnPrompt`: add the voice guardrails (ours, no named influencers) and a gentle nudge — if the custom habit reads as an outcome ("lose weight"), the reframe should point toward the daily behaviour that serves it, per *presence not output*.
- **Cache invalidation:** personalised copy only generates once, at onboarding handoff. Existing users (Shirley) carry old cached copy. After the prompt update, trigger a one-shot silent regeneration on next app open (idempotent flag, same pattern as the existing boot backfills in `_layout.tsx`).

---

## PHASE 2 — Galaxy: cycles become clusters, north star becomes the sky `[plan → sign-off → build]`

Real canvas work in `components/galaxy/CosmosCanvas.tsx` — sequence it on its own, last. The bones exist: the canvas already lays days on a Vogel golden-angle spiral (today at center) and already computes visual clusters via union-find proximity (`computeNebulaClouds`). Re-anchor clustering from proximity to *cycle membership*, and add the north star as a fixed mark.

The metaphor is astronomically earned (use it in Learn copy): **open star clusters** are real — stars born from one cloud that travel the galaxy together. Twenty-one days of presence, moving as a set. And **Polaris** is what you navigate by precisely because it doesn't move.

### 2.1 — 21-day cycle = a cluster
- Each cycle's present-days render as one coherent cluster. Repurpose the nebula-cloud glow as a soft per-cycle field behind each cluster's stars.
- The galaxy accumulates clusters — chapters. The day-21 review becomes a visual event: the cluster settles.
- Cold start: cycle 1 in progress reads as "your first cluster forming" — intentional, not sparse. Seed the faint cosmic-web texture from day 1.

### 2.2 — Cluster naming: auto-suggest + editable
At the day-21 review, the cluster gets a **pre-filled, editable name** — derive a gentle default from what "stuck" in the review (fallback: `cycle N`), and let her overwrite it. Ownership without blank-page freeze, landing at the reflective moment.
- `types/index.ts`: add `name?: string` to `CycleReview`.
- `components/CycleReviewSheet.tsx`: name field above confirm, pre-filled.
- Render the name as a quiet label near each cluster in the galaxy.
- Note: the review already persists past day 21 (`getCycleDay` clamps at 21, so `cycleReviewPending` stays true until reviewed — good, keep that). It currently only surfaces on the galaxy tab; add a quiet one-line prompt on home when a review is pending (*"cycle 1 is complete — review it in galaxy when you're ready"*), never a takeover.

### 2.3 — North star in the sky — **beacon (locked)**
The north star stops being a tab and becomes a **fixed teal four-point star near the top of the galaxy canvas**, goal text as a quiet label beneath it. Clusters build and reach toward it. *Today* stays at the spiral center — no layout fight. Optional: a faint dashed leader from the newest cluster up toward the star.
- Tapping the star shows the goal text (and, post-1.5, deep-links to the profile edit if she wants to change it). **No logging, no prompt** — it's a bearing, not a button.
- Use the brand-correct **four-point** silhouette for this mark (not the eight-point asterisk currently in `assets/` — see Tier 4). If the redrawn PNGs aren't ready, draw the beacon as SVG per the four-point spec so it ships correct.

---

## TIER 3 — Friction, accuracy & UI (patch-in-place)

### 3.1 — Scientific-accuracy sweep of Learn/concepts
Audit every quantified claim in `lib/concepts.ts` and `app/(tabs)/learn.tsx`; soften numbers stated more precisely than the evidence supports (e.g. *"reduces sleep-onset by ~9 min," "eat 20–30% less"*). Keep the mechanism, hedge the magnitude (*"in some trials," "for many people"*). Don't strip the science — stop it overclaiming.

### 3.2 — Home screen density
Today currently stacks ~12 surfaces. Tier 1.2 kills the double counter; 1.5 makes the north-star strip static and quiet; 1.6 removes the unlock redirect. After those land, re-audit: the anchors should be the visual center of gravity. Project tease and reveal beat stay conditional (they already are). The Sunday reflection banner stays — it's original brand, distinct from the removed north-star check-in.

### 3.3 — "4 of 6 = present" is hardcoded and can be false ★ new in v9
The home presence block hardcodes the label `4 of 6 = present` — but users can add custom habits (up to two per group), so someone running 8 habits reads a label describing a stack they don't have. `getPresenceThreshold` correctly keeps the target at 4 regardless of count — **document that as intentional** (adding habits must never raise the bar to be "present"; that's engineered slack, not a bug — leave a comment so a future session doesn't "fix" it). Then make the label honest: derive it (`4 of {activeCount} = present`) or simplify to `4 = present`.

### 3.4 — Carried from pre-launch audit
- **Contrast:** audit `Colors.textTertiary` on `Colors.background`; lift where WCAG AA fails.
- **Completed evening items render dimmed** (~30% via time-aware section opacity) — reads as a glitch. Completed items hold full opacity.
- **Name styling:** home greeting renders the name lowercase inline; brand reserves serif-italic + capitalisation (*Shirley*). Handoff does it right — match it.

---

## TIER 4 — Asset hygiene (flag, not code)
`assets/stars/star-full@3x.png` is an 8-point asterisk; spec is a hand-drawn **four-point** star (*"never an asterisk"*). Render pipeline (`StarMark.tsx`) is correct — only the PNGs are wrong. Procreate redraw of four PNGs + align the SVG fallback. Shirley owns this. Phase 2's beacon must use the correct four-point silhouette either way.

---

## Out of scope
- Web-push honesty copy and localStorage backup/trust risk — tracked in `pulsare-pre-launch-audit.md`, separate workstream.
- No new dependencies, no new services.

---

## Execution order
1. **Tier 0** — guardrails into CLAUDE.md. Five minutes; protects everything after it.
2. **1.1–1.3** — de-brand strings, drop 75-day, fix milestone. Find/replace, low risk.
3. **1.5** — north star reframe: delete weight machinery + check-in sheet, add profile edit field, guard old data.
4. **1.6** — retire phase-unlock system. Removes the day-21/22 collision before anyone can hit it.
5. **1.7 + 1.8** — re-pace concepts to cycles; update the AI prompts + one-shot copy regeneration. Do together — both are "the copy engine catches up to the product."
6. **1.4** — onboarding simplification. Plan → sign-off → build.
7. **Tier 3** — accuracy sweep, presence-label fix, density re-audit, contrast/dimming/name.
8. **Phase 2** — galaxy clusters + beacon. Plan → sign-off → build. Biggest lift, done last.
9. **Tier 4** — handed to Shirley.

Bump `CACHE` in `web/sw.js` when cached assets change. Deploy with `vercel --prod --archive=tgz`. Never say done until deployed and the force-close-reopen step is passed to Shirley. End with `/wrap-up`.
