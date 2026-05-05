import type { HabitLearnContent } from '@/types';
import { getHabits, upsertHabit } from './storage';

export async function generateCustomHabitLearnContent(
  habitId: string,
  label: string,
): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) return;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are writing educational content for a nervous system reset app called Pulsare. A user has added a custom habit called "${label}".

Write two pieces of content about this habit. Respond ONLY with valid JSON — no preamble, no markdown, no explanation.

{
  "reframe": "string",
  "science": "string"
}

Rules:
- reframe: 1 sentence. a shift in perspective on why this habit matters. lowercase. warm, direct, never clinical or cheerful.
- science: 2–3 sentences. the physiological or psychological mechanism behind this habit. plain language, lowercase. grounded in real science.
- never use exclamation marks, "amazing", "great job", "well done", "proud", "crush it"
- if the habit name is ambiguous, interpret it charitably as a health or wellbeing practice`,
          },
        ],
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const text = (data.content as { type: string; text: string }[])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return;

    const content = JSON.parse(match[0]) as HabitLearnContent;

    const habits = getHabits();
    const habit = habits[habitId];
    if (!habit) return;

    upsertHabit({ ...habit, learnContent: content });
  } catch {
    // silent fallback — habit remains without learn content
  }
}
