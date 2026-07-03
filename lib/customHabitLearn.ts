import type { HabitLearnContent } from '@/types';
import { getHabits, upsertHabit } from './storage';
import { API_BASE } from './apiBase';

// Generation happens server-side (api/generate-copy.ts); see personalisedCopy.ts.

export async function generateCustomHabitLearnContent(
  habitId: string,
  label: string,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/generate-copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'habit-learn', label }),
    });

    if (!response.ok) return;

    const content = (await response.json()) as HabitLearnContent;
    if (typeof content?.reframe !== 'string' || typeof content?.science !== 'string') return;

    const habits = getHabits();
    const habit = habits[habitId];
    if (!habit) return;

    upsertHabit({ ...habit, learnContent: content });
  } catch {
    // silent fallback — habit remains without learn content
  }
}
