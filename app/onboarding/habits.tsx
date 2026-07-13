import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';
import type { CustomSeed } from '@/lib/habits';
import type { DayPhase } from '@/types';

interface HabitOption {
  id: string;
  label: string;
  dayPhase: DayPhase;
  suggested: boolean;
  why: string; // one-liner rationale — surfaced on the tile
}

// Phase 1 · 0–8h post-wake (activation window)
// Ordered by biological leverage. The suggested four are the circadian + nervous-system foundation.
const PHASE_1_OPTIONS: HabitOption[] = [
  {
    id: 'wake-anchor',
    label: 'wake ritual',
    dayPhase: 'phase1',
    suggested: true,
    why: 'feet on floor, light within 10 minutes, water before coffee. the ritual counts, not the clock — woke late? run it anyway. the wake time comes back through tonight\'s wind-down.',
  },
  {
    id: 'morning-light',
    label: 'morning light (10 min)',
    dayPhase: 'phase1',
    suggested: false,
    why: 'already part of the wake ritual — pick this only if you want light tracked on its own.',
  },
  {
    id: 'water-before-coffee',
    label: 'delay caffeine 90 min',
    dayPhase: 'phase1',
    suggested: true,
    why: 'protects natural cortisol peak. prevents afternoon crash + tolerance.',
  },
  {
    id: 'morning-movement',
    label: 'movement (20–30 min)',
    dayPhase: 'phase1',
    suggested: true,
    why: 'BDNF, dopamine, activation. outdoors doubles as morning-light.',
  },
  {
    id: 'project-hour',
    label: 'move the needle (30 min)',
    dayPhase: 'phase1',
    suggested: false,
    why: 'creative or upskill practice — but name the project. a habit that starts with "decide which project" dies first. rename this tile to the actual thing, swap it at your 21-day review.',
  },
  {
    id: 'breakfast',
    label: 'protein-first breakfast',
    dayPhase: 'phase1',
    suggested: false,
    why: 'blood sugar + appetite regulation. skip if you fast comfortably.',
  },
  {
    id: 'nervous-system-reset',
    label: 'breathwork (2 min)',
    dayPhase: 'phase1',
    suggested: true,
    why: 'cyclic sighing lowers cortisol fast. two minutes is enough.',
  },
];

// Phase 2 · 9–15h post-wake (wind-down window)
// Wind-down ritual replaces the old bedtime+phone-off+evening-anchor triple.
const PHASE_2_OPTIONS: HabitOption[] = [
  {
    id: 'calorie-log',
    label: 'north star anchor',
    dayPhase: 'phase2',
    suggested: true,
    why: 'the one habit that directly serves your north star. rename it to the actual action — "track calories", "prep tomorrow\'s food" — whatever this season needs.',
  },
  {
    id: 'evening-anchor',
    label: 'wind-down ritual',
    dayPhase: 'phase2',
    suggested: true,
    why: 'screens off + lights low + into bed. one signal, not three. within 30 minutes of your target still counts — this is the only clock in the whole system, and you get a fresh shot at it every night.',
  },
  {
    id: 'evening-journal',
    label: 'journal (3 sentences)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'clears rumination. cuts sleep-onset by ~9 min in trials.',
  },
  {
    id: 'nsdr',
    label: 'nsdr / yoga nidra (10 min)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'non-sleep deep rest. restores dopamine + focus without sleeping.',
  },
  {
    id: 'phone-off-reading',
    label: 'read (10 min)',
    dayPhase: 'phase2',
    suggested: false,
    why: 'fiction lowers cortisol measurably. displaces the scroll — and doubles as the way you get to bed on time.',
  },
];

const MIN_HABITS = 4;
const MAX_HABITS = 8;
const SUGGESTED_COUNT = 6;

interface LocalCustom extends CustomSeed {
  key: string; // local list key
}

function loadSelected(): string[] {
  const raw = storage.getString('onboarding.selectedHabits');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [
    ...PHASE_1_OPTIONS.filter((h) => h.suggested).map((h) => h.id),
    ...PHASE_2_OPTIONS.filter((h) => h.suggested).map((h) => h.id),
  ];
}

function loadRenames(): Record<string, string> {
  const raw = storage.getString('onboarding.habitRenames');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    } catch {}
  }
  return {};
}

function loadCustoms(): LocalCustom[] {
  const raw = storage.getString('onboarding.customHabits');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CustomSeed[];
      if (Array.isArray(parsed)) {
        return parsed.map((c, i) => ({ ...c, key: `saved_${i}` }));
      }
    } catch {}
  }
  return [];
}

export default function HabitsScreen() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(loadSelected()));
  const [renames, setRenames] = useState<Record<string, string>>(() => loadRenames());
  const [customs, setCustoms] = useState<LocalCustom[]>(() => loadCustoms());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const total = selected.size + customs.length;
  const isValid = total >= MIN_HABITS && total <= MAX_HABITS;
  const atCap = total >= MAX_HABITS;

  function toggle(opt: HabitOption) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt.id)) {
        next.delete(opt.id);
        return next;
      }
      if (next.size + customs.length >= MAX_HABITS) return prev;
      next.add(opt.id);
      return next;
    });
  }

  function setRename(id: string, name: string) {
    setRenames((prev) => {
      const next = { ...prev };
      const trimmed = name.trim();
      if (trimmed) next[id] = trimmed;
      else delete next[id];
      return next;
    });
  }

  function addCustom(dayPhase: DayPhase, label: string, reason: string): boolean {
    const trimmed = label.trim();
    if (!trimmed || atCap) return false;
    setCustoms((prev) => [
      ...prev,
      { key: `new_${Date.now()}`, label: trimmed, dayPhase, reason: reason.trim() || null },
    ]);
    return true;
  }

  function removeCustom(key: string) {
    setCustoms((prev) => prev.filter((c) => c.key !== key));
  }

  function handleNext() {
    if (!isValid) return;
    storage.set('onboarding.selectedHabits', JSON.stringify(Array.from(selected)));
    storage.set('onboarding.habitRenames', JSON.stringify(renames));
    storage.set(
      'onboarding.customHabits',
      JSON.stringify(customs.map(({ label, dayPhase, reason }) => ({ label, dayPhase, reason }))),
    );
    setOnboardingLastScreen(4);
    router.push('/onboarding/notifications');
  }

  const p1Count =
    PHASE_1_OPTIONS.filter((o) => selected.has(o.id)).length +
    customs.filter((c) => c.dayPhase === 'phase1').length;
  const p2Count =
    PHASE_2_OPTIONS.filter((o) => selected.has(o.id)).length +
    customs.filter((c) => c.dayPhase === 'phase2').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={7} current={4} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.question}>
            pick your habits
          </Text>

          {/* Explainer — placed at top so context lands before the picker */}
          <View style={styles.explainer}>
            <ExplainLine
              heading="phase 1 · 0–8h after waking"
              body="cortisol, dopamine, and norepinephrine are elevated. hard habits ride this chemistry. the 4 suggested ones are the highest-leverage anchors from circadian + nervous system research — the wake ritual sets the clock and the day, delaying caffeine protects natural cortisol, movement stacks BDNF, and breathwork lowers cortisol fast."
            />
            <ExplainLine
              heading="phase 2 · 9–15h after waking"
              body="serotonin rises, stress tapers. wind-down habits belong here. the 2 suggested ones are the north star anchor (the habit that serves your goal) and a compound wind-down (screens off + lights low + bedtime — one signal, not three)."
            />
            <ExplainLine
              heading="21-day cycle"
              body="not when the habit is 'formed'. when you stop tracking and see what your body holds on its own. day 21 = review. some carry forward, some drop, some get swapped. three cycles = 63 days = deep."
            />
            <ExplainLine
              heading="the rule of 4"
              body="you don't need every habit every day. 4 = present, whatever your total. that's the whole point — a day where you did enough is a day that counts."
            />
          </View>

          <Text variant="label" style={styles.pickPrompt}>
            we suggest {SUGGESTED_COUNT} — pick at least {MIN_HABITS}, up to {MAX_HABITS}. anything missing? add your own. tap "why this one?" on any tile.
          </Text>

          <HabitGroup
            title="phase 1 — morning window"
            hint={`${p1Count} picked`}
            dayPhase="phase1"
            options={PHASE_1_OPTIONS}
            selected={selected}
            renames={renames}
            customs={customs}
            expandedId={expandedId}
            renamingId={renamingId}
            atCap={atCap}
            onExpand={setExpandedId}
            onToggle={toggle}
            onRename={setRename}
            onStartRename={setRenamingId}
            onAddCustom={addCustom}
            onRemoveCustom={removeCustom}
          />

          <HabitGroup
            title="phase 2 — evening window"
            hint={`${p2Count} picked`}
            dayPhase="phase2"
            options={PHASE_2_OPTIONS}
            selected={selected}
            renames={renames}
            customs={customs}
            expandedId={expandedId}
            renamingId={renamingId}
            atCap={atCap}
            onExpand={setExpandedId}
            onToggle={toggle}
            onRename={setRename}
            onStartRename={setRenamingId}
            onAddCustom={addCustom}
            onRemoveCustom={removeCustom}
          />

          {atCap && (
            <Text variant="label" color={Colors.textTertiary} style={styles.capNote}>
              {MAX_HABITS} is the ceiling — consistency drops as the list grows. swap, don't stack.
            </Text>
          )}

          <Text variant="label" style={styles.micro}>
            swap any of these after your first 21-day review. the goal isn't the perfect stack — it's the one you'll actually run.
          </Text>
        </View>

        <Button
          label={
            isValid
              ? 'next'
              : `pick ${MIN_HABITS - total} more`
          }
          onPress={handleNext}
          disabled={!isValid}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ExplainLine({ heading, body }: { heading: string; body: string }) {
  return (
    <View style={styles.explainRow}>
      <Text variant="bodySemibold" color={Colors.tealText} size={13}>{heading}</Text>
      <Text variant="label" color={Colors.textSecondary} style={styles.explainBody}>{body}</Text>
    </View>
  );
}

function HabitGroup({
  title,
  hint,
  dayPhase,
  options,
  selected,
  renames,
  customs,
  expandedId,
  renamingId,
  atCap,
  onExpand,
  onToggle,
  onRename,
  onStartRename,
  onAddCustom,
  onRemoveCustom,
}: {
  title: string;
  hint: string;
  dayPhase: DayPhase;
  options: HabitOption[];
  selected: Set<string>;
  renames: Record<string, string>;
  customs: LocalCustom[];
  expandedId: string | null;
  renamingId: string | null;
  atCap: boolean;
  onExpand: (id: string | null) => void;
  onToggle: (opt: HabitOption) => void;
  onRename: (id: string, name: string) => void;
  onStartRename: (id: string | null) => void;
  onAddCustom: (dayPhase: DayPhase, label: string, reason: string) => boolean;
  onRemoveCustom: (key: string) => void;
}) {
  const groupCustoms = customs.filter((c) => c.dayPhase === dayPhase);
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text variant="label" style={styles.groupTitle}>{title}</Text>
        <Text variant="label" color={Colors.tealText} style={styles.groupHint}>{hint}</Text>
      </View>
      <View style={styles.options}>
        {options.map((opt) => {
          const isSelected = selected.has(opt.id);
          const isExpanded = expandedId === opt.id;
          // deselecting a tile mid-rename cancels the rename
          const isRenaming = renamingId === opt.id && isSelected;
          const displayLabel = renames[opt.id] ?? opt.label;
          return (
            <View key={opt.id} style={[styles.tile, isSelected && styles.tileSelected]}>
              <TouchableOpacity
                onPress={() => onToggle(opt)}
                style={styles.tileHeader}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.tileText}>
                  <Text
                    variant="body"
                    color={isSelected ? Colors.tealText : Colors.textSecondary}
                  >
                    {displayLabel}
                  </Text>
                </View>
                <View style={[styles.check, isSelected && styles.checkOn]} />
              </TouchableOpacity>
              {isRenaming ? (
                <TextInput
                  style={styles.renameInput}
                  defaultValue={renames[opt.id] ?? opt.label}
                  autoFocus
                  returnKeyType="done"
                  maxLength={60}
                  onEndEditing={(e) => {
                    onRename(opt.id, e.nativeEvent.text);
                    onStartRename(null);
                  }}
                  onSubmitEditing={(e) => {
                    onRename(opt.id, e.nativeEvent.text);
                    onStartRename(null);
                  }}
                  accessibilityLabel={`rename ${opt.label}`}
                />
              ) : (
                <View style={styles.tileLinks}>
                  <TouchableOpacity
                    onPress={() => onExpand(isExpanded ? null : opt.id)}
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? 'hide reasoning' : 'show reasoning'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text variant="label" color={Colors.textTertiary} style={styles.whyLink}>
                      {isExpanded ? 'hide why' : 'why this one?'}
                    </Text>
                  </TouchableOpacity>
                  {isSelected && (
                    <TouchableOpacity
                      onPress={() => onStartRename(opt.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`rename ${displayLabel}`}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text variant="label" color={Colors.textTertiary} style={styles.whyLink}>
                        rename
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {isExpanded && (
                <Text variant="label" color={Colors.textSecondary} style={styles.whyBody}>
                  {opt.why}
                </Text>
              )}
            </View>
          );
        })}

        {groupCustoms.map((custom) => (
          <View key={custom.key} style={[styles.tile, styles.tileSelected]}>
            <View style={styles.tileHeader}>
              <View style={styles.tileText}>
                <Text variant="body" color={Colors.tealText}>{custom.label}</Text>
                {!!custom.reason && (
                  <Text variant="label" color={Colors.textTertiary} style={styles.customReason}>
                    {custom.reason}
                  </Text>
                )}
              </View>
              <View style={[styles.check, styles.checkOn]} />
            </View>
            <TouchableOpacity
              onPress={() => onRemoveCustom(custom.key)}
              accessibilityRole="button"
              accessibilityLabel={`remove ${custom.label}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="label" color={Colors.textTertiary} style={styles.whyLink}>
                remove
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <AddCustomTile dayPhase={dayPhase} disabled={atCap} onAdd={onAddCustom} />
      </View>
    </View>
  );
}

function AddCustomTile({
  dayPhase,
  disabled,
  onAdd,
}: {
  dayPhase: DayPhase;
  disabled: boolean;
  onAdd: (dayPhase: DayPhase, label: string, reason: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [reason, setReason] = useState('');

  function handleAdd() {
    if (!label.trim()) return;
    // only clear + close if the add actually landed (it no-ops at the cap)
    if (!onAdd(dayPhase, label, reason)) return;
    setLabel('');
    setReason('');
    setOpen(false);
  }

  if (!open) {
    return (
      <TouchableOpacity
        style={[styles.tile, styles.addTile, disabled && styles.addTileDisabled]}
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="add your own habit"
        disabled={disabled}
      >
        <Text variant="label" color={disabled ? Colors.textTertiary : Colors.tealText} style={styles.addLabel}>
          + add your own
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.tile, styles.tileSelected]}>
      <TextInput
        style={styles.renameInput}
        value={label}
        onChangeText={setLabel}
        placeholder="the habit — small and daily"
        placeholderTextColor={Colors.textTertiary}
        autoFocus
        maxLength={60}
        returnKeyType="next"
        accessibilityLabel="custom habit name"
      />
      <TextInput
        style={styles.renameInput}
        value={reason}
        onChangeText={setReason}
        placeholder="why does this matter to you? (optional)"
        placeholderTextColor={Colors.textTertiary}
        maxLength={120}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        accessibilityLabel="why this habit matters"
      />
      {disabled && (
        <Text variant="label" color={Colors.textTertiary} style={styles.capInlineNote}>
          you're at 8 — remove one to add this.
        </Text>
      )}
      <View style={styles.addActions}>
        <TouchableOpacity
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="add habit"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="label" color={Colors.tealText} style={styles.addAction}>add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setOpen(false);
            setLabel('');
            setReason('');
          }}
          accessibilityRole="button"
          accessibilityLabel="cancel adding habit"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="label" color={Colors.textTertiary} style={styles.addAction}>cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { gap: 20, paddingVertical: 20 },
  question: { lineHeight: 36 },
  subtitle: { color: Colors.textTertiary, fontSize: 13, letterSpacing: 0.4, marginTop: -8, lineHeight: 18 },
  pickPrompt: { color: Colors.textSecondary, fontSize: 13, letterSpacing: 0.4, lineHeight: 18, marginTop: 4 },
  explainer: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  explainRow: { gap: 4 },
  explainBody: { fontSize: 12, lineHeight: 18 },
  group: { gap: 10 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupTitle: { color: Colors.textSecondary, letterSpacing: 0.6, fontSize: 12 },
  groupHint: { fontSize: 12 },
  options: { gap: 8 },
  tile: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  tileSelected: {
    borderColor: Colors.tealAction,
    backgroundColor: `${Colors.tealAction}18`,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  tileText: { flex: 1, gap: 2 },
  tileLinks: { flexDirection: 'row', gap: 16 },
  whyLink: { fontSize: 11, letterSpacing: 0.4 },
  whyBody: { fontSize: 12, lineHeight: 18, paddingTop: 4 },
  customReason: { fontSize: 11, lineHeight: 15 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  checkOn: {
    borderColor: Colors.tealAction,
    backgroundColor: Colors.tealAction,
  },
  // 16px minimum — anything smaller triggers iOS Safari auto-zoom on focus
  renameInput: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Outfit_300Light',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.tealAction,
    paddingVertical: 6,
  },
  addTile: {
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 14,
  },
  addTileDisabled: { opacity: 0.4 },
  addLabel: { fontSize: 13, letterSpacing: 0.4 },
  addActions: { flexDirection: 'row', gap: 24, paddingTop: 4 },
  capInlineNote: { fontSize: 11, lineHeight: 15 },
  addAction: { fontSize: 12, letterSpacing: 0.4, lineHeight: 20 },
  capNote: { fontSize: 12, lineHeight: 18, marginTop: -8 },
  micro: { lineHeight: 20, fontSize: 13 },
  button: { marginTop: 8 },
});
