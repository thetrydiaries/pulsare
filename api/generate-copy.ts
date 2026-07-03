import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from './_lib/redis';
import { isAllowedOrigin } from './_lib/guard';

// Prompts live server-side so the endpoint can't be used as an open relay:
// clients send structured fields, never prompt text.

interface PersonalisedInput {
  kind: 'personalised';
  name: string;
  startingMood: string;
  wakeTime: string;
  movementType: string;
  breathworkExperience: string;
  eveningHabitLabel: string;
  projectName: string | null;
  startDate: string;
}

interface HabitLearnInput {
  kind: 'habit-learn';
  label: string;
}

type Input = PersonalisedInput | HabitLearnInput;

function clean(value: unknown, max: number): string {
  return String(value ?? '').slice(0, max);
}

function buildPersonalisedPrompt(u: PersonalisedInput): string {
  return `You are generating personalised in-app copy for a nervous system reset app called Pulsare. The user has just completed onboarding. Here is everything you know about them:

Name: ${clean(u.name, 40)}
Starting mood: ${clean(u.startingMood, 80)}
Wake time: ${clean(u.wakeTime, 5)}
Movement choice: ${clean(u.movementType, 60)}
Breathwork experience: ${clean(u.breathworkExperience, 20)}
Evening habit: ${clean(u.eveningHabitLabel, 60)}
Project they're working on: ${clean(u.projectName, 120) || 'not specified'}
Start date: ${clean(u.startDate, 10)}

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
  },
  "milestoneGreetings": {
    "day3": "string",
    "day7": "string",
    "day21": "string"
  },
  "breathworkIntros": {
    "physiological-sigh": "string",
    "cyclic-sigh": "string",
    "box-breathing": "string"
  }
}

Rules for the copy:
- All strings lowercase (the user's name is the only exception — capitalise it as entered)
- Warm, direct, never clinical or cheerful
- Habit explanations: 1–2 sentences, plain language, reference the user's specific choices where relevant (their movement type, their evening habit, their project name if given)
- Completion acknowledgements: very short (3–6 words max), lowercase, warm — the moment after the tap. Should feel like a quiet nod, not a celebration.
- Greeting variations: 5 variations per time band. Morning: "good morning, [Name]." style. Afternoon: "good afternoon, [Name]." style. Evening: "good evening, [Name]." style. Late night (9pm–5am): "still up, [Name]." style — warm, non-judgmental. Each band: some warmer or more personal. At least one per band should reference their project if they gave one. At least one should be very minimal.
- Milestone greetings: three short strings, all lowercase except the user's name. Day 3 should acknowledge that something has started without making it feel like a big deal. Day 7 should feel like a quiet landmark — real but not loud. Day 21 should feel like genuine completion of something, with forward momentum toward what's next. Never use: "amazing", "great job", "proud", "crushing it", "well done". Include the user's name in at least one. 3–10 words each.
- Breathwork intro lines: one line per technique, displayed at the top of the breathwork guide screen beneath the technique name. Lowercase. Warm, direct, minimal. Should communicate the purpose of this specific technique in plain language — not the mechanism, the feeling or the use case. Max 10 words each. Reference the user's context where relevant (e.g. if they described themselves as running on empty, the sigh intro might acknowledge urgency).
- Never use: "amazing", "great job", "well done", "proud", "crush it", "keep going", "don't give up"
- Never use exclamation marks`;
}

function buildHabitLearnPrompt(input: HabitLearnInput): string {
  return `You are writing educational content for a nervous system reset app called Pulsare. A user has added a custom habit called "${clean(input.label, 40)}".

Write two pieces of content about this habit. Respond ONLY with valid JSON — no preamble, no markdown, no explanation.

{
  "reframe": "string",
  "science": "string"
}

Rules:
- reframe: 1 sentence. a shift in perspective on why this habit matters. lowercase. warm, direct, never clinical or cheerful.
- science: 2–3 sentences. the physiological or psychological mechanism behind this habit. plain language, lowercase. grounded in real science.
- never use exclamation marks, "amazing", "great job", "well done", "proud", "crush it"
- if the habit name is ambiguous, interpret it charitably as a health or wellbeing practice`;
}

async function rateLimit(req: VercelRequest): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // fail open — origin check still applies
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  const key = `ratelimit:generate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return count <= 20; // 20 generations/hour/IP is far above legitimate use
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'generation not configured' });
  }
  if (!(await rateLimit(req))) {
    return res.status(429).json({ error: 'too many requests' });
  }

  const input = req.body as Input;
  let prompt: string;
  let model: string;
  let maxTokens: number;

  if (input?.kind === 'personalised') {
    prompt = buildPersonalisedPrompt(input);
    model = 'claude-sonnet-4-6';
    maxTokens = 1500;
  } else if (input?.kind === 'habit-learn' && typeof input.label === 'string' && input.label.trim()) {
    prompt = buildHabitLearnPrompt(input);
    model = 'claude-haiku-4-5-20251001';
    maxTokens = 300;
  } else {
    return res.status(400).json({ error: 'invalid input' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: 'generation failed' });
  }

  const data = (await response.json()) as { content: { type: string; text: string }[] };
  const text = data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return res.status(502).json({ error: 'no json in response' });
  }

  try {
    return res.status(200).json(JSON.parse(match[0]));
  } catch {
    return res.status(502).json({ error: 'invalid json in response' });
  }
}
