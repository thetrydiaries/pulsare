# Future Considerations

Two lenses: product management and neuroscience. Neither list is exhaustive — both are prioritised by impact.

---

## Part 1 — Product Manager Review

### What's Missing

**1. No Outcome Measurement (Highest Impact)**

The app makes a specific promise — nervous system regulation over 13 weeks — but never measures it. There's no way for a user to answer "is this actually working?" You have a starting mood at onboarding but nothing to compare it against. Without a periodic "how are you feeling now vs. week 1" check-in, users who improve have no mirror to see it, and users who don't have no signal to adjust. This is the strongest retention and word-of-mouth lever, and it's missing.

**2. No Business Model**

Nothing in the codebase suggests a paywall, subscription, or monetisation path. For a 13-week protocol app, a free week-one trial + subscription gate at phase 2 unlock is the natural model. Without it, there's no way to sustain the Claude API costs, which are being passed through with no revenue to offset them.

**3. Retention After Week 2 Is Undefined**

The first week has high novelty. But there's no mechanic specifically designed to pull users through the weeks 2–3 trough — the period where habits aren't automatic yet but the novelty is gone. The weekly reflection and phase explainer exist but are passive. Something active — a mid-week check-in prompt, a milestone acknowledgement at day 14, a personalised insight from the data already collected — would materially improve 30-day retention.

**4. Phase Unlock Is Fuzzy** ✓ *implemented — copy updated to "phases unlock on a fixed schedule — the pacing is part of the protocol."*

The modal says phases "unlock when you're ready — not on a timer" but the code unlocks on a fixed week schedule. That copy creates an expectation of flexibility that doesn't exist. Either make it truly adaptive (unlock phase 2 only after X% presence in phase 1) or change the copy. Right now it's a promise the app isn't keeping.

**5. No Sharing / Social Proof Layer**

The galaxy view is genuinely beautiful data visualisation. There's no way to share it. A user hitting a 21-day streak or completing phase 1 has no outlet for that satisfaction beyond the app. A single "share your streak" card — even a static PNG export — is a free acquisition channel and a meaningful reward moment.

**6. Notifications Are Static and Generic**

Three hard-coded notification times are set in onboarding and never revisited. There's no adaptive nudging (e.g. if a user never completes evening habits, shift the wind-down notification earlier). No skip/snooze logic. No acknowledgement when a notification leads to a completion. These are the highest-leverage retention touchpoints and they're treated as a checkbox.

**7. Onboarding Has No Recovery Path**

13 steps with no save state means if a user backgrounds the app mid-onboarding, they start over. There's also no "I already tried this" re-entry flow for someone who uninstalls and reinstalls. First-session completion is the single most important conversion metric, and right now it's fragile.

**8. Custom Habits Are Underserved**

Users can add custom habits but they don't get: their own notification slot, a way to edit them after creation (only remove), or any protocol context (what phase do they belong to, how do they relate to the nervous system goals). They feel bolted on rather than first-class.

**9. No Offboarding or Completion Story**

What happens at week 13? The app has no completion state, no "you finished the protocol" moment, no answer to "what now?" Users who make it to week 13 are the most valuable cohort — they're the testimonial, the referral, the repeat subscriber — and right now they fall off a cliff.

---

**The single thing to build first:** outcome measurement. A 5-second weekly mood/energy check-in that shows a trend line against week 1 turns the app from "habit tracker" to "proof that this works." That's what converts trial users to evangelists.

---

## Part 2 — Neuroscientist Review

The protocol's foundation is solid — wake anchor, water before coffee, movement, breathwork, evening wind-down are all well-supported. But there are meaningful gaps where the app drifts from the neuroscience, and a few places where it's missing the highest-leverage interventions entirely.

### Critical Gaps

**1. Light is the most powerful circadian anchor and it's absent** ✓ *implemented — "morning light" added as a Phase 1 morning habit (after wake-anchor, before water-before-coffee), with micro-explanation and handoff summary entry.*

The app tracks wake time but never mentions morning bright light exposure. The suprachiasmatic nucleus (SCN) — the master circadian clock — is entrained almost entirely by light, not by wake time alone. Waking at 6am in a dark room does very little for circadian anchoring. Getting outdoor light (or 10,000 lux lamp) within 30 minutes of waking is the single highest-evidence intervention for circadian health. It suppresses residual melatonin, triggers the cortisol awakening response (CAR), and sets adenosine clearance timing for the whole day.

This should be a Phase 1 habit, arguably before movement.

**2. Habit timing is unanchored from the circadian timeline**

The app labels habits as "morning" or "evening" but doesn't specify when within those windows. This matters enormously:

- Caffeine within 90 minutes of waking stacks on top of the natural cortisol spike, building tolerance and blunting the CAR. "Water before coffee" is right, but the real instruction is *delay coffee by 90 minutes*.
- Movement 45–60 minutes post-waking hits the BDNF (brain-derived neurotrophic factor) peak optimally — this is the window where exercise creates the strongest neuroplasticity signal.
- The post-movement window (~1–2 hours) is a genuine plasticity window when BDNF is elevated. Learning-adjacent habits (morning pages, reading) should be scheduled here, not randomly in "morning."

The app is teaching the right habits in the wrong sequence.

**3. Breathwork is tracked but not specified**

Different protocols have completely different neurological effects:

- **Box breathing** (4-4-4-4): activates the prefrontal cortex, reduces amygdala reactivity — good for anxiety and focus
- **Cyclic sighing** (extended exhale): most efficiently activates the vagus nerve, fastest HRV recovery
- **4-7-8**: maximises parasympathetic activation, best for sleep onset
- **Physiological sigh** (double-inhale, slow exhale): acute stress reset, works in 1–2 breaths

Treating all breathwork as equivalent is like treating a 2-minute walk and a sprint interval session as the same nervous system input. The app needs to recommend a specific protocol per use case (morning alertness vs. evening wind-down) and explain why they're different.

**4. No implementation intentions** ✓ *implemented — new onboarding screen (step 12/13) showing 4 pre-built if-then stack cards using the user's actual habit choices. Inserted between start-date and handoff.*

Gollwitzer's research (1999, replicated many times) shows that "if-then" planning — *"After I wake up, I will drink water before leaving my bedroom"* — increases follow-through by 200–300% compared to intention alone. The mechanism is neurological: implementation intentions pre-load the behavior into working memory, so the cue automatically triggers the routine without requiring deliberate prefrontal cortex activation.

The app sets notification times but never asks users to form the if-then plan. Onboarding should end with explicit habit stacking statements: *"After [existing anchor], I will [new habit]."* This is the single cheapest, highest-ROI neuroplasticity intervention not currently in use.

**5. The body check word is being wasted**

Collecting a daily single-word body check is genuinely clever — it's a brief interoception exercise that, repeated daily, builds the anterior insula–medial prefrontal cortex circuit responsible for self-awareness and emotional regulation. But the data is only surfaced in the weekly reflection.

Pattern recognition is a primary driver of behavioural change. If a user says "foggy" every Monday and "sharp" every Thursday, that's a detectable signal. Surfacing it — *"you tend to feel foggy on Mondays — this often correlates with weekend sleep drift"* — turns a passive logging feature into an active self-regulation teacher. The data and the Claude integration to do this already exist.

### Protocol-Level Issues

**6. Phase 1 starts with too many habits simultaneously**

On day 1, a Phase 1 user gets 5 habits. Habit formation is PFC-heavy in the early stages — each new habit requires conscious deliberate activation, which is metabolically expensive. Neuroscience suggests sequentially loading: anchor 1–2 behaviours for 2 weeks until they show signs of automaticity, then add the next. Starting with 5 means none of them consolidate properly before phase 2 arrives.

The 50% threshold helps but doesn't solve the consolidation problem — users can hit 50% every day without the same habits becoming automatic, because they're rotating which ones they do.

**7. "Morning pages" in Phase 2 is neurologically contested**

Free-form morning writing activates the default mode network (DMN), the same network implicated in rumination and mind-wandering. For users with high baseline anxiety or depression, doing unstructured stream-of-consciousness writing before the prefrontal cortex has fully come online may increase rumination rather than reduce it.

If morning pages stay, the app should give guidance on *how* to write (forward-looking prompts rather than open-ended stream of consciousness) and offer an alternative for users who find it destabilising.

**8. The logical day boundary should be relative to wake time**

The 3am boundary is a product convenience, not neuroscience. Circadian research would set the day boundary at roughly 6 hours before the user's anchored wake time — for a 6am waker that's midnight, for a 9am waker it's 3am. A 5am waker currently gets no credit for habits completed between midnight and 3am. A small fix, but one that would be more faithful to the science the protocol is built on.

### Missing Levers

**9. Temperature is absent**

Morning cold exposure (even 30 seconds of cold water at the end of a shower) triggers a sustained norepinephrine and dopamine release (200–300% above baseline) lasting 2–4 hours. Evening warm bath or shower accelerates core body temperature drop, which is the primary physiological trigger for sleep onset.

These are among the most evidence-backed nervous system regulation tools available and they cost nothing. They should be in the protocol.

**10. No sleep quality capture**

Sleep is when neuroplasticity actually happens — long-term potentiation is consolidated during slow-wave sleep, emotional memories are processed during REM, BDNF synthesis peaks overnight. Everything the app builds during the day is either cemented or degraded by what happens at night. Without a morning sleep quality signal (even a 1–5 tap), the app is optimising inputs with no visibility into the most important output. It also means the app can never surface the single most useful insight: *your habits are working — look at your sleep trend.*

**11. No explicit reward timing design**

The app gives acknowledgement immediately on habit completion — correct, immediate reward matters for early habit formation. But dopamine research shows that anticipation of reward drives behaviour more sustainably than the reward itself. As habits solidify, the anticipation signal needs to shift from the app's acknowledgement to the behaviour itself becoming intrinsically rewarding.

The app should actively coach this transition: in Phase 1, provide explicit positive feedback; by Phase 3, ask "how did your body feel during that?" — redirecting attention to intrinsic reward. The current acknowledgement text is consistent across all 13 weeks, which may inadvertently keep users extrinsically dependent rather than building intrinsic motivation.

---

**The highest-leverage change:** add morning light exposure to Phase 1 and anchor every habit to a precise window on the circadian timeline rather than a loose "morning/evening" label. The app currently teaches the right habits but treats them as a menu rather than a sequence. Sequence *is* the science. The circadian timeline is the invisible architecture the whole protocol is built on — surfacing it explicitly would transform the app from a habit tracker into an actual chronobiology tool.
