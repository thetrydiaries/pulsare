import { getUser, setPersonalisedCopy, getPersonalisedCopy, storage } from './storage';
import { getActiveHabits } from './habits';
import { API_BASE } from './apiBase';
import type { PersonalisedCopy } from '@/types';

// Generation happens server-side (api/generate-copy.ts) so no API key ever
// ships in the client bundle. The client sends structured fields only.

/** Returns true when fresh copy was generated and stored. */
export async function generatePersonalisedCopy(): Promise<boolean> {
  const user = getUser();
  if (!user) return false;

  const selectedHabits = getActiveHabits().map((h) => ({
    id: h.suggestedId ?? h.id,
    label: h.userLabel ?? h.label,
  }));

  try {
    const response = await fetch(`${API_BASE}/api/generate-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'personalised',
        name: user.name,
        startingMood: user.startingMood,
        wakeTime: user.wakeTime,
        movementType: user.movementType,
        breathworkExperience: user.breathworkExperience,
        eveningHabitLabel: user.eveningHabitLabel,
        projectName: user.projectName,
        startDate: user.startDate,
        selectedHabits,
        northStar: user.capstone?.goal ?? null,
      }),
    });

    if (!response.ok) {
      console.error('[personalisedCopy] API error', response.status);
      return false;
    }
    const copy = (await response.json()) as PersonalisedCopy;
    if (!copy?.greetingVariations) {
      console.error('[personalisedCopy] unexpected response shape');
      return false;
    }
    // Fetch-then-swap: old copy stays until new copy lands. Carry the
    // shown-milestones ledger across so day 3/7/21 greetings never repeat.
    const shownMilestones = getPersonalisedCopy()?.shownMilestones;
    setPersonalisedCopy(shownMilestones ? { ...copy, shownMilestones } : copy);
    return true;
  } catch {
    // silent fallback — default strings used throughout the app
    return false;
  }
}

// ─── One-shot regeneration after the v9 prompt update ────────────────────────
// The server prompts changed (six-habit model, north star, day-21 truth), so
// copy cached before the update keeps re-introducing stale framing. Regenerate
// once per install; flag is set only on success so an offline boot retries
// silently next time. Safe to call on every boot.

const REGEN_FLAG = 'personalisedCopy.regenV2';

export async function regeneratePersonalisedCopyOnce(): Promise<void> {
  if (storage.getBoolean(REGEN_FLAG)) return;
  if (!getPersonalisedCopy()) {
    // Nothing cached — either a fresh install (handoff generates it) or
    // generation never succeeded. Either way there's no stale copy to replace.
    storage.set(REGEN_FLAG, true);
    return;
  }
  const ok = await generatePersonalisedCopy();
  if (ok) storage.set(REGEN_FLAG, true);
}
