import { getUser, setPersonalisedCopy } from './storage';
import type { PersonalisedCopy } from '@/types';

export async function generatePersonalisedCopy(): Promise<void> {
  const user = getUser();
  if (!user) return;

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
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are generating personalised in-app copy for a nervous system reset app called Pulsare. The user has just completed onboarding. Here is everything you know about them:

Name: ${user.name}
Starting mood: ${user.startingMood}
Wake time: ${user.wakeTime}
Movement choice: ${user.movementType}
Breathwork experience: ${user.breathworkExperience}
Evening habit: ${user.eveningHabitLabel}
Project they're working on: ${user.projectName || 'not specified'}
Start date: ${user.startDate}

Generate personalised copy for this user. Respond ONLY with valid JSON — no preamble, no markdown, no explanation. Format:

{
  "habitExplanations": {
    "wake-anchor": "string",
    "water-before-coffee": "string",
    "morning-movement": "string",
    "nervous-system-reset": "string",
    "evening-anchor": "string"
  },
  "completionAcknowledgements": {
    "wake-anchor": "string",
    "water-before-coffee": "string",
    "morning-movement": "string",
    "nervous-system-reset": "string",
    "evening-anchor": "string"
  },
  "greetingVariations": {
    "morning": ["string", "string", "string", "string", "string"],
    "afternoon": ["string", "string", "string", "string", "string"],
    "evening": ["string", "string", "string", "string", "string"],
    "latenight": ["string", "string", "string", "string", "string"]
  }
}

Rules for the copy:
- All strings lowercase (the user's name is the only exception — capitalise it as entered)
- Warm, direct, never clinical or cheerful
- Habit explanations: 1–2 sentences, plain language, reference the user's specific choices where relevant (their movement type, their evening habit, their project name if given)
- Completion acknowledgements: very short (3–6 words max), lowercase, warm — the moment after the tap. Should feel like a quiet nod, not a celebration.
- Greeting variations: 5 variations per time band. Morning: "good morning, [Name]." style. Afternoon: "good afternoon, [Name]." style. Evening: "good evening, [Name]." style. Late night (9pm–5am): "still up, [Name]." style — warm, non-judgmental. Each band: some warmer or more personal. At least one per band should reference their project if they gave one. At least one should be very minimal.
- Never use: "amazing", "great job", "well done", "proud", "crush it", "keep going", "don't give up"
- Never use exclamation marks`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[personalisedCopy] API error', response.status);
      return;
    }
    const data = await response.json();
    const text = (data.content as { type: string; text: string }[])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    // Extract the first {...} JSON object regardless of surrounding markdown or prose.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[personalisedCopy] No JSON object found in response');
      return;
    }
    const copy = JSON.parse(match[0]) as PersonalisedCopy;
    setPersonalisedCopy(copy);
  } catch {
    // silent fallback — default strings used throughout the app
  }
}
