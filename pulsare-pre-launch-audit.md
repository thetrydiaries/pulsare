# Pulsare — Pre-Launch Audit

**Date:** 13 June 2026
**Inputs reviewed:** Live PWA (pulsare-peach.vercel.app), 9 in-app screenshots, Brand Guidelines v1.0, the full source code in this folder (lib/, app/, components/, assets/), App Store launch requirements, consumer retention benchmarks. Findings below are code-verified where noted.

---

## The honest headline

The brand system is genuinely world-class — better than most funded consumer apps. The voice, the galaxy metaphor, the anti-streak philosophy, the "back." re-entry concept: that's a real, defensible product identity. The problem is that the app, as built, **violates its own brand bible in several load-bearing places**, and the technical foundation can't yet support the emotional promise ("the last habit app you'll ever need"). Nothing here is unfixable. But the top three items below are existential, not cosmetic.

---

## The 10 things that matter, in order

### 1. Data durability is existential — and right now it doesn't exist

**Diagnosis (code-verified).** Storage is `@react-native-async-storage/async-storage` (`lib/storage.ts`) — which on web is plain **localStorage**. Local-only, no account, no sync, and a grep of the codebase finds no export/backup/share path anywhere. The entire emotional contract of Pulsare is *"your galaxy grows with you indefinitely."* You are asking a burnout-recovering user to invest months — eventually years — of presence into an artifact that vanishes if they lose their phone, clear Safari data, or switch devices. On the PWA specifically, localStorage can be evicted by the OS under storage pressure; the user doesn't even have to do anything wrong. One person losing a 200-day galaxy and posting about it is a brand-ending event for a product whose whole pitch is safety and trust.

**Fix.**
- Now (days): a manual export/import (JSON file) reachable from settings. Cheap insurance.
- Before native launch (weeks): automatic backup — iCloud key-value/CloudKit or a minimal account with sync. Anonymous-by-default (sign in with Apple) keeps friction near zero.
- Do not market "the last habit app you'll ever need" until the galaxy survives a lost phone.
**Effort:** Export = 1–2 days. Sync = the single biggest engineering line item before launch, and worth it.

### 2. "Current streak" and "100% presence rate" contradict the product's soul

**Diagnosis.** The galaxy header shows `5 days present · 100% presence rate · 5 current streak`. Your own guardrails say: *never use "streak" in a way that implies it can be broken*, and the galaxy *"is not a score; there is no pass or fail."* A "current streak" resets to zero on a miss — that's the exact punishment mechanic Pulsare exists to reject. "100% presence rate" is worse: it's a grade, and it can only go down. The first missed day turns the marquee screen into an indictment. This isn't a copy nitpick; it's the one screen where the product currently behaves like the apps it defines itself against.

**Fix.** Replace with metrics that only accumulate: total days present, days present this month, "longest stretch" framed as history not status (or drop it entirely). If you want a consistency signal, show it as density in the galaxy itself — that's what the metaphor is for. **Effort:** days, mostly product decision.

### 3. The comeback experience is the product — and it's the least proven path

**Diagnosis (code-verified).** Your differentiation is not the checklist (Streaks, Habitify, Atoms all have one). It's the fall-off and return: the "back." screen, the never-miss-twice amber nudge, the tinted return star, "the door is always the same door." The good news: `app/falloff.tsx`, `isFallOff()`, the return-day star state, and the never-miss-twice / fall-off notifications all exist in code, and a `devMode.ts` is already there. The risk is twofold. First, the live screenshots show a user at 100% presence, so the miss/absence/re-entry paths have plausibly never been exercised under real conditions — and they carry the most edge cases (3am-boundary misses, retroactive logging via `PastDayEditSheet`, return-after-30-days). Second, **there is zero analytics in the codebase** — no instrumentation of any kind in `package.json`. You will launch completely blind on the one metric that decides this product's fate: return rate after a lapse. Industry D30 retention for this category sits around 4–7%; the return loop is where you beat that number or don't.

**Fix.** Use devMode to walk every state: 1 miss, 2 misses (amber), 3–13 days gone, 14+ days gone, return day, day after return. Polish each to the same standard as the happy path — the "back." screen should be the most beautiful screen in the app. One copy note there: *"you were away for 11 days."* states the absence to the user's face; it doesn't ask "what happened?", but it does make them look at the number. Consider whether the door needs a number on it at all. Then add privacy-respecting analytics (even PostHog/Amplitude with anonymised events) before launch. **Effort:** ~1 week, highest ROI in this list.

### 4. Day-boundary bug: the header and the active day disagree

**Diagnosis (code-verified, exact location found).** The Today screen says **"saturday 13 june"** at 12:36am while the week strip and galaxy correctly treat Friday the 12th as the active day. The architecture is right — `lib/dayBoundary.ts` implements a clean 3am rule and nearly everything reads `getLogicalDate()` — but the header at `app/(tabs)/index.tsx:345` renders `new Date().toLocaleDateString(...)` directly, bypassing the boundary. Same class of bug at line 202: `setIsSunday(new Date().getDay() === 0)` means the Sunday reflection trigger also ignores the 3am rule (it will fire at 12:01am Sunday, during Saturday's logical day). For a sleep-anchored app, an ambiguous "what day is it" breaks trust in exactly the wind-down window the app cares most about.

**Fix.** Make the header and the Sunday check read from `getLogicalDate()` / `parseDate()`. At 12:36am the header should still say "friday 12 june" (or, nicer, "friday, late"). Audit the codebase for any other raw `new Date()` used for *day identity* rather than clock time. **Effort:** hours, plus edge tests (DST, timezone travel).

### 5. The star — your core motif — is off-spec

**Diagnosis (code-verified).** The brand book is unambiguous: a gestural **four-point** hand-drawn star, *"never a perfect geometric star, never an asterisk."* I opened the shipped assets: `assets/stars/star-full@3x.png` is a hand-drawn **eight-point asterisk-style** star. The pencil texture is there and the render pipeline in `StarMark.tsx` is exactly right (PNGs at 1×/2×/3×, tint and opacity applied at render, correct state config, sensible SVG fallback) — but the silhouette itself is the shape your own guardrails ban. The single most repeated visual element in the product contradicts the spec. Either the assets are wrong or the spec is; right now the app and the brand book disagree, and that ambiguity will leak into marketing assets, the app icon, and the widget.

**Fix.** Decide which is canonical. If the four-point spec stands (I'd keep it — four points reads "star," eight reads "asterisk/snowflake"), redraw the four PNGs in Procreate; the code needs zero changes. Also align the SVG fallback path to the final silhouette. **Effort:** an afternoon of drawing.

### 6. Week 1 carries 10–11 daily habits — the protocol contradicts "reduce initiation cost"

**Diagnosis.** Phase 1 is called *stabilise* and the brand's first principle is *reduce initiation cost first* — yet the Today screen lists ~6 morning items, ~4 evening items, and a "+" to add more. The brand book's own reference screen shows five anchors. For the stated audience (executive dysfunction, depression, foggy brain), eleven checkboxes on day one is a wall, and items like "calorie deficit" are outcome-tracking, which the brand explicitly disclaims ("we track presence, never output"). Users sabotaging themselves with over-ambitious setups is the most predictable failure mode in this category.

**Fix.** Cap or strongly shape week 1: protocol anchors (3–5) locked in, personal additions gently deferred ("week 2 is when we add. week 1 is just showing up."). If a user adds an outcome-style habit, allow it (autonomy is therapy) but consider a soft nudge toward presence framing. **Effort:** days; mostly content/UX.

### 7. The PWA silently runs without the core mechanic — and users aren't told

**Diagnosis (code-verified).** Pulsare's behavioural engine is notifications ("anchors, not alarms" — 7:00am, 10:30am, 9:30pm, the never-miss-twice nudge, the fall-off message). The native side is real: `lib/notifications.native.ts` implements all of it via expo-notifications, and you already have `ios/`, `eas.json`, and a built `Pulsare.ipa`. But `lib/notifications.web.ts` is a **stub — every function is a no-op and `requestPermissions()` returns `false`**. So every PWA user (including anyone you send the Vercel link to) experiences Pulsare with its nervous-system engine switched off, with no indication that the native app behaves differently. They'll judge — and churn from — a version that can't actually run the protocol. A web product that quietly lacks the mechanism the Learn tab describes also undercuts the "we mean what we say" trust the brand depends on.

**Fix.** Either implement web push for installed PWAs (possible since iOS 16.4, but fiddly and unreliable — probably not worth it), or be honest in-product: a quiet one-liner on web ("anchors arrive as notifications in the app. the web version is the quiet room."), plus a link-out once the App Store listing exists. Prioritise finishing the native launch — you're closer than the audit brief implied. While there, the iOS week-strip widget (your brand book already specs "future days — widget only") is both a retention lever and a strong answer to Apple's guideline 4.2. **Effort:** web honesty copy = hours; widget ≈ 1 week.

### 8. Accessibility: your quietest text fails the contrast your guidelines claim

**Diagnosis.** Computed against #0C0C0C: primary #EDE8E0 = 16.0:1 ✓, secondary #BAB5AC = 9.6:1 ✓, teal-soft = 8.3:1 ✓, amber = 6.4:1 ✓ — but **tertiary #6E6A63 = 3.64:1**, which fails WCAG AA (4.5:1) at the 13px micro-explanation size it's specified for (3:1 only passes at 18px+/14px bold). The guidelines state "all text passes WCAG AA — test before shipping"; it doesn't. The micro-explanations are also your science layer — the content your foggy-brained audience most needs to be able to read. Also: missed-day stars at 0.06 opacity and future outlines at 0.08 are effectively invisible to low-vision users, and dim-on-dark UIs are hardest for exactly the demographic (depression correlates with reduced contrast sensitivity).

**Fix.** Lift tertiary to ≈ #807B72 (≥4.5:1) — still quiet, now legible. Reserve #6E6A63/#383838 for 18px+ only. Add an "increase contrast" toggle honouring the OS setting, verify Dynamic Type doesn't break layouts, and add accessibility labels to stars (VoiceOver should say "tuesday — present"). **Effort:** days. Also an App Store review and ADA/quality signal.

### 9. Day 22 is undesigned — the retention cliff after the program ends

**Diagnosis.** The 21-day anchoring program is the hook, but the vision is indefinite. What does the user see on day 22? On week 6? The Learn tab has one weekly essay; phases imply progression ("phase 1 · stabilise" — how many phases? what changes?). Category benchmarks say D30 retention for adjacent categories is roughly 4–7%; your wedge is that *lapsed users come back* — but that only works if there's a living system to come back to, not a completed program. Right now the post-21-day product is invisible, which usually means undefined.

**Fix.** Design the steady state explicitly: what phase 2/3 unlock (precision, load, autonomy?), a monthly "your galaxy this month" quiet reflection (no score — density, one sentence), seasonal Learn content, and the long-absence re-entry (after 30+ days away, the galaxy is the asset that brings people back: "your galaxy kept the lights on."). This is also where a sustainable subscription justifies itself, which forces the adjacent decision you haven't made yet: **pricing**. One-time, subscription, or free-forever changes onboarding, paywall placement, and App Store metadata — decide before building store assets. **Effort:** strategy week + ongoing content.

### 10. Trust and compliance for a mental-health-adjacent app

**Diagnosis.** Pulsare's positioning references depression, executive dysfunction, and HPA-axis dysregulation, and it collects emotionally sensitive input (the morning body-feel word, journalling prompts). That raises the bar in three places: (a) App Store requirements — privacy policy URL, accurate privacy nutrition labels, and account deletion if accounts ship; (b) claims — "nervous system reset," "recovery tool," and cortisol mechanisms read as quasi-therapeutic; keep claims educational and add a brief, on-voice disclaimer ("pulsare is a self-care tool, not treatment. if you're struggling, a professional is the right door.") to avoid both Apple scrutiny and (in Australia) therapeutic-goods-style claim risk; (c) data care — the check-in words and any journal content should be treated as sensitive: encrypted at rest when sync arrives, never in analytics, explicitly covered in the policy.

**Fix.** Privacy policy + labels + disclaimer copy ≈ 2–3 days. Review every marketing claim against "educational, not curative." Cheap now, expensive after rejection or a trust incident.

---

## Smaller things (fast wins, do in idle moments)

- **Name styling breaks your own type rules.** The greeting renders "still up, shirley." — the brand book reserves Playfair *italic with capitalisation* for the user's name (*Shirley*). The name is the single most personal element; render it per spec.
- **Month view is unreadable.** Stars float in empty space with no date anchors; faint days are invisible (see #8). Add quiet day-number ghosting or collapse to a denser grid.
- **Galaxy cold start is underwhelming.** Five stars in a void undersells the marquee feature. Consider an early zoom level that makes few stars feel intimate rather than sparse, and seed the canvas with the faint cosmic-web texture so the promise is visible from day 1.
- **Checked evening items render dimmed.** "move the needle" shows checked but at 30% time-aware opacity — reads as a glitch. Completed items should hold full opacity regardless of section dimming.
- **"guide" affordance floats.** On the affirmations row, "guide" looks like stray text, not a tappable link. Give it a hairline underline or chevron.
- **Onboarding is ~14 screens** (`app/onboarding/`: welcome, name, science, wake-time, breathwork, movement, evening, custom-habit, mood, intentions, project, notifications, start-date, handoff). For an audience defined by initiation cost, that's long — though `setOnboardingLastScreen` resume support is a smart mitigation. Worth a dedicated pass: which screens earn their place before the user has felt any value?
- **Streak vs presence-rate code mismatch.** `getPresentDaysCount` counts only `full`/`return` days, so a partial day (showed up, below threshold) drops the presence rate and breaks the streak — "presence over performance" says showing up at all should count for something. Revisit whether `partial` belongs in presence.
- **App Store discoverability.** "Pulsare" will compete with "pulsar" autocorrect; lock the subtitle/keyword set early ("habit reset," "burnout recovery," "gentle habit tracker") and check trademark availability in AU/US.

---

## What's already world-class (don't touch)

The brand book itself — the we-say/we-don't-say table is the best voice spec I've seen at this stage. "still up, shirley." at 12:36am. The notification copy ("7:00. same as yesterday. same as tomorrow."). The never-flash-red rule. The cosmic-web/neural-network framing — true, poetic, and ownable. The lowercase discipline. The four-state star system *as specified* (now make the assets match it). And the codebase is cleaner than most consumer apps at this stage: a single day-boundary module, render-time star tinting exactly per spec, accessibility labels already on the fall-off screen, onboarding resume state. The bones are good.

---

## Suggested order of attack

1. Quick fixes, days not weeks: header/Sunday logical-date bug (#4), contrast lift (#8), JSON export (#1 cheap half), star redraw (#5), web-notifications honesty line (#7).
2. Brand-integrity sprint: streak/score replacement (#2) + week-1 load shaping (#6) + partial-day presence decision.
3. Retention engine: walk and polish the miss/return paths with devMode, add analytics (#3).
4. Launch vehicle: finish the native build you've already started — notifications QA, widget, store assets (#7) — alongside the privacy/claims pass (#10) and the pricing decision.
5. Then the big rock: backup/sync (#1) and the day-22+ steady state (#9) before you market "the last habit app you'll ever need."

---

*Benchmark and App Store reference sources: getstream.io app retention guide 2026; uxcam.com mobile app retention benchmarks; appcues.com retention benchmarks; iossubmissionguide.com guideline 4.2; mobiloud.com webview rejection guide; developer.apple.com App Review Guidelines.*
