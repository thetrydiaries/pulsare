# Pulsare — Design Amendments v4 → v5

Hand this file to Claude Code alongside `the_reset_app_prompt_v4.md`. Apply these amendments on top of v4. Do not rewrite v4 — patch only the sections referenced below.

Skill applied: `ui-ux-pro-max` (accessibility, touch & interaction, layout & spacing, typography & colour, navigation patterns, light/dark mode contrast).

---

## 1. Colour — Tertiary Text Contrast Fix

**Section in v4:** Design system → Colour palette

**Problem:** `#383838` on `#0c0c0c` yields ~2.3:1 contrast ratio. This fails WCAG AA (4.5:1 minimum for normal text) and will be nearly invisible on iPhone 17 Pro OLED in any ambient light. The PRD acknowledged this risk but did not resolve it.

**Skill rules triggered:** `color-contrast` (CRITICAL), `color-accessible-pairs`, `Text contrast (dark)` — primary ≥4.5:1, secondary ≥3:1.

**Amendment:**

Replace:
```
Tertiary text / micro-explanations: #383838
```

With:
```
Tertiary text / micro-explanations: #6b6660
```

`#6b6660` on `#0c0c0c` = ~4.6:1. Passes WCAG AA. Still recedes relative to secondary text (`#bab5ac`). Visual hierarchy is preserved through size and weight, not contrast alone.

**Note for implementation:** Tertiary text is now used exclusively for the sleep note at the bottom of the home screen. Micro-explanations are moving to the Learn screen (see Amendment 5). This means the contrast-edge use case is significantly reduced in frequency, but the value must still be corrected regardless.

---

## 2. Galaxy Screen — Left-Side Clipping Fix

**Section in v4:** In-app screens → 2. Galaxy screen

**Problem:** Galaxy canvas is clipping on the left side. Safe area insets are not being applied to the star canvas container.

**Skill rules triggered:** `safe-area-awareness` (CRITICAL), `Safe-area compliance`, `System bar clearance`.

**Amendment:**

Add explicit safe area and horizontal padding spec to the Galaxy screen section:

> The star canvas container must apply `paddingHorizontal: 20` plus the device's horizontal safe area inset (use `useSafeAreaInsets()` from `react-native-safe-area-context`). This applies at all three zoom levels (week, month, year). The tab row (week / month / year) must use the same horizontal inset as the canvas so labels and stars are left-aligned consistently. Do not clip the canvas to the screen edge — all star content must sit within the safe area boundary.

---

## 3. Home Screen — Days Present Block Repositioned

**Section in v4:** In-app screens → 1. Home screen — daily check-in

**Problem:** The streak/days-present block sits at the bottom of the home screen — lowest attention zone. For a user with executive dysfunction, their primary progress signal must be immediately visible without scrolling. It is currently the last thing they see, not the first.

**Skill rules triggered:** `content-priority` (show core content first on mobile), `visual-hierarchy`, `primary-action` (one primary signal per screen, visually dominant).

**Amendment:**

Remove the following from the bottom of the home screen spec:
```
Bottom of screen: streak number in large personal serif + "days present" label + sleep note in faintest text
```

Replace with this block inserted **between** the interoceptive prompt and the week strip:

> **Presence block** — sits directly beneath the interoceptive prompt, above the week strip.
> - Days present count in large Playfair Display 400 (same size as the greeting)
> - Label beneath: "days present" in Outfit 300, tertiary text colour
> - Sleep note displayed beneath the label in tertiary text: *"to protect your [wake time], aim to be in bed by [calculated time]."*
> - No border, no card surface. Lives in the open layout, same horizontal padding as the greeting.

The bottom of the screen now ends with the last habit group. No persistent element at the very bottom — the navigation bar handles that zone.

---

## 4. Star Sizing — Intentional Layered Sizing Clarified

**Section in v4:** Galaxy view — the consistency record → Star states

**Context:** Variable star sizing is intentional design, not a bug. Size and opacity working together create perceived depth — foreground stars (large, bright), mid-field (medium, moderate), background (small, faint). This is what makes the galaxy view read as dimensional rather than a flat grid. The question is not whether to use layered sizing, but how to implement it consistently in code. See Amendment 8 for the full rendering spec.

**Amendment — clarify the size scale explicitly in the star states table:**

Update the star states section to read:

> **Star states — four states, layered size + opacity for depth:**
> - Full day (presence threshold met) — 24pt, opacity 0.9. Foreground.
> - Partial day (at least 1 habit complete, below threshold) — 18pt, opacity 0.45. Mid-field.
> - Missed day — 12pt, opacity 0.06. Background presence. Not an X. Not a gap. Just barely there.
> - Return day (first day back after 2+ missed) — 26pt, teal tint (#8fb0a4), opacity 0.9. Distinct but not celebratory.
>
> Today's star in the week strip renders at 1.2× its state size as a "you are here" marker. This applies to the home screen week strip and streak widget only — not the galaxy view.

---

## 5. Micro-Explanations — Removed from Habit Rows, Moved to Learn Screen

**Section in v4:** In-app screens → 1. Home screen; Phase 1/2/3 habit descriptions; Design system → Typography

**Problem:** Persistent micro-copy on every habit row becomes invisible through repetition. It also conflates two different types of content — motivational reframes ("a signal, not a workout") and neuroscience mechanisms ("cortisol peaks at wake") — which have different jobs and belong in different places.

**Skill rules triggered:** `progressive-disclosure` (reveal complexity progressively, don't overwhelm upfront), `content-priority`, `whitespace-balance` (use whitespace to group and separate; avoid visual clutter).

**Amendment — home screen habit rows:**

Remove the micro-explanation line from every habit row in the daily view.

Each habit row now renders:
> - Habit name in Outfit 400, secondary text colour
> - 44pt minimum tap target circle on the right
> - Completion state: circle fills, name shifts to muted teal, quiet tick appears
> - No second line of text beneath the habit name

The row is clean. The science lives elsewhere. Initiation friction is reduced.

---

## 6. New Screen — Learn

**Section in v4:** In-app screens (add new section after Weekly reflection)

**Rationale:** Micro-explanations had real value — they were the primary place the app communicated *why* the protocol works. Moving them off the home screen doesn't mean losing them. It means giving them space to actually land. The Learn screen is where the science lives. It is also where the weekly neuroscience concept (new in v5) is surfaced.

**Navigation change:** Replace the three-item bottom nav `today / galaxy / profile` with `today / galaxy / learn`. Move profile to a settings icon (⚙ or similar) in the top-right of the home screen status bar. Profile is a low-frequency action. Learn is worth a tab.

**Skill rules triggered:** `bottom-nav-limit` (≤5, labels + icons), `nav-label-icon` (icon + text always), `nav-hierarchy` (primary vs secondary nav clearly separated), `primary-action` (profile is secondary, not primary navigation).

---

### Learn screen spec

**Header:** "learn" in Playfair Display 400 italic, primary text colour.

**Two sections, separated by a single 1px `#1c1c1c` rule:**

---

#### Section 1 — Your habits

A scrollable list of the user's active habits. Each entry expands on tap (accordion pattern). Collapsed state shows habit name only in Outfit 400. Expanded state reveals:

- **The reframe** — one line, Outfit 400, secondary text colour. Motivational. (e.g. *"this isn't a workout — it's a signal"*)
- **The science** — one short paragraph, Outfit 300, tertiary text colour (`#6b6660`). Mechanistic. (e.g. *"low-intensity morning movement resets cortisol rhythm and signals to your nervous system that the day is safe to begin. outdoors amplifies the effect via light exposure, but isn't required."*)

Tapping a collapsed row expands it. Tapping again collapses. Only one row open at a time. No chevron animation required — a simple opacity fade on the expanded content (200ms) is sufficient.

**Habit affordance on the home screen:** Each habit row on the home screen gains a barely-visible dot (2pt, tertiary colour) to the right of the habit name — not the tap circle — as a passive signal that more exists. No label. No tooltip. Users who want to know more will find it in Learn. Users who don't, won't notice it.

---

#### Section 2 — This week

A single card. Dark surface (`#141414`), 1px border (`#1c1c1c`), 16px corner radius.

Displays one neuroscience concept per week. Content is phase-gated and sequenced — the concept is always contextually relevant to what the user is building that week.

**Card anatomy:**
- Concept title in Playfair Display 400, primary text colour (e.g. *"neuroplasticity"*)
- One-sentence definition beneath in Outfit 300, secondary text colour
- 3–4 paragraph body in Outfit 300, secondary text colour, with generous line height (1.6). Plain language. No jargon without definition. No citations — this is not a paper.
- At the bottom of the card, in tertiary text: *"new concept in [N] days"* — so the user knows the cadence without being given a countdown that adds pressure

Card refreshes on Monday of each week (aligned with the weekly reset). If the user is mid-phase, they pick up at the concept for their current week number.

**Phase-sequenced concept library (Build Phase 1 — weeks 1–3):**

| Week | Concept | Why this week |
|------|---------|---------------|
| 1 | Circadian rhythm | They've just set a wake anchor. Explain why consistency matters more than the time itself. |
| 2 | The cortisol awakening response | They've been doing water-before-coffee and morning movement. Explain what's actually happening hormonally. |
| 3 | Neuroplasticity | They've completed three weeks. Explain what they've literally been building. |

Weeks 4–13 concepts to be defined in Build Phase 2 spec, covering: HRV and the vagus nerve, sleep architecture, the default mode network, habit loop mechanics, interoception, allostatic load, the gut-brain axis, blood glucose and mood, and working memory under stress.

---

**Navigation:** Learn is accessed via the bottom nav tab. No back navigation required — it is a top-level screen. The accordion expand/collapse is in-place and does not push a new screen.

---

## 7. Pre-Delivery Checklist Additions (from skill)

Before shipping Build Phase 1, verify:

- [ ] Tertiary text `#6b6660` on `#0c0c0c` passes 4.5:1 — confirm with contrast checker
- [ ] All habit row tap targets confirmed ≥44×44pt including the expanded Learn accordion rows
- [ ] Galaxy canvas applies `useSafeAreaInsets()` horizontal inset + `paddingHorizontal: 20` on all zoom levels
- [ ] Bottom nav labels present alongside icons (today / galaxy / learn) — icon-only nav is not acceptable per skill rule `nav-label-icon`
- [ ] Profile settings icon in top-right has ≥44×44pt tap target and an `accessibilityLabel`
- [ ] Learn accordion respects `prefers-reduced-motion` — fade only, no transform animation
- [ ] Week strip today-star size increase does not cause layout shift in the surrounding row
- [ ] All four star opacity states tested on iPhone 17 Pro display profile (high brightness OLED) — ghost star (~0.06) must still be perceptible, not invisible

---

---

## 8. Galaxy View — MVP Rendering Spec

**Section in v4:** Galaxy view — the consistency record

**Context:** The galaxy view does not require a custom canvas library (no Skia, no SVG canvas, no react-native-reanimated-canvas). The MVP is built with absolutely positioned `<Image>` components inside a `<View>` with `flexWrap`. This is sufficient for week (7 stars) and month (~31 stars) views, which are the only views required in Build Phase 1. The year view (365 stars) is Build Phase 2 and can be revisited for performance at that point.

---

### Rendering logic

For each day in the visible range, the renderer:

1. Looks up the day's state from the habit log: `full | partial | missed | return | future`
2. Selects the corresponding PNG asset from `/assets/stars/`
3. Applies opacity per the star states table
4. Applies size per the size scale below
5. Applies a deterministic positional offset to break the grid

```
for each day in visibleRange:
  state = habitLog[date]?.state ?? 'future'
  asset = starAssets[state]         // PNG file
  opacity = opacityMap[state]
  size = sizeMap[state]
  offset = deterministicOffset(date) // see below
  render <Image source={asset} style={{ opacity, width: size, height: size,
          transform: [{ translateX: offset.x }, { translateY: offset.y }] }} />
```

---

### Star asset map

| State | Asset file | Opacity | Size |
|-------|-----------|---------|------|
| `full` | `star_full.png` | 0.9 | 24pt |
| `partial` | `star_partial.png` | 0.45 | 18pt |
| `missed` | `star_missed.png` | 0.06 | 12pt |
| `return` | `star_return.png` | 0.9 | 26pt — teal tint via `tintColor: '#8fb0a4'` |
| `future` | `star_missed.png` | 0.04 | 10pt — placeholder, not a state |

Asset fallback: if PNG files are not yet present in `/assets/stars/`, render a four-point SVG star path at the same opacity and size values. Replace with PNGs when assets are delivered. Do not block the build on asset delivery.

---

### Deterministic positional offset

Each star gets a small x/y nudge seeded from its date string. This makes the field read as organic rather than a rigid grid, without the offset changing between renders.

```javascript
function deterministicOffset(dateString: string): { x: number; y: number } {
  // Simple hash from date string — no external library needed
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * 31 + dateString.charCodeAt(i)) & 0xffffffff;
  }
  const x = ((hash & 0xff) / 255 - 0.5) * 6; // ±3pt
  const y = (((hash >> 8) & 0xff) / 255 - 0.5) * 6; // ±3pt
  return { x, y };
}
```

Maximum offset is ±3pt in each axis. Small enough that the grid structure is readable. Large enough that it stops looking like a spreadsheet. The offset is identical every render for the same date — no jitter.

---

### Layout structure

**Week view:** Single `<View>` with `flexDirection: 'row'`, `justifyContent: 'space-between'`, padding from safe area inset + 20pt horizontal. Seven stars in a row.

**Month view:** `<View>` with `flexDirection: 'row'`, `flexWrap: 'wrap'`, fixed cell width of `(screenWidth - insets - 40) / 7`. Days padded to start on the correct weekday column using empty spacer Views for the leading days of the month.

**Both views:** Wrap the star grid in a `<ScrollView scrollEnabled={false}>` — the galaxy screen itself scrolls, not the grid.

---

*Amendments authored for v4 → v5. Skill: ui-ux-pro-max. Changes: tertiary text contrast corrected (#383838 → #6b6660); galaxy safe area padding specified; days present block repositioned above week strip; star sizing retained with layered size+opacity for depth (size exception for today's week strip star documented); micro-explanations removed from habit rows; Learn tab added to bottom nav replacing profile; profile moved to top-right settings icon; Learn screen fully specified with habit accordion and weekly neuroscience concept card; phase-sequenced concept library defined for weeks 1–3; galaxy MVP rendering spec added (no Skia, PNG assets + absolute positioning, deterministic offset algorithm, asset fallback to SVG, layout structure for week and month views).*
