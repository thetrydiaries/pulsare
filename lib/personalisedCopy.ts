import { getUser, setPersonalisedCopy } from './storage';
import { API_BASE } from './apiBase';
import type { PersonalisedCopy } from '@/types';

// Generation happens server-side (api/generate-copy.ts) so no API key ever
// ships in the client bundle. The client sends structured fields only.

export async function generatePersonalisedCopy(): Promise<void> {
  const user = getUser();
  if (!user) return;

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
      }),
    });

    if (!response.ok) {
      console.error('[personalisedCopy] API error', response.status);
      return;
    }
    const copy = (await response.json()) as PersonalisedCopy;
    if (!copy?.greetingVariations) {
      console.error('[personalisedCopy] unexpected response shape');
      return;
    }
    setPersonalisedCopy(copy);
  } catch {
    // silent fallback — default strings used throughout the app
  }
}
