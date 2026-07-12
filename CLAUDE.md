# CLAUDE.md — Pulsare

Habit tracking app. Expo / React Native, shipped as a **PWA** — Shirley uses it installed on her phone from https://pulsare-peach.vercel.app. That is the live product. A native iOS build exists (`ios/`, `Pulsare.ipa`) but is blocked on an Apple Developer account — don't touch it unless asked.

## Stack
- Expo SDK 54 + expo-router, React 19, TypeScript
- User data (habits, logs, reflections) lives in AsyncStorage on device — no account, no cloud sync of habit data. Backup/restore is manual JSON (profile → your data).
- Thin backend in `api/` (Vercel serverless functions): `generate-copy.ts` (Claude proxy — key is server-side `ANTHROPIC_API_KEY`, never in the bundle), `push/subscribe.ts` + `push/tick.ts` (web push).
- Web push: subscriptions in Upstash Redis (Marketplace, `KV_REST_API_*`), QStash pings `/api/push/tick` every 5 min (schedule made via `scripts/setup-push-schedule.sh`), VAPID keys + `PUSH_TICK_SECRET` in Vercel env. iOS only delivers to the home-screen PWA.
- Web export: `npm run export:web` (expo export + `scripts/inject-pwa.js`) → static site in `dist/`
- Hosted on Vercel; `vercel.json` sets buildCommand + output dir
- Service worker: `web/sw.js`, network-first, cache name `pulsare-v3`. `inject-pwa.js` MUST ship the `serviceWorker.register` script — Expo emits its own `rel="manifest"`, so never gate SW registration on the manifest being absent (that bug silently disabled push + offline for months).

## Commands
- Dev: `npm start`, then open http://localhost:8081 for web
- Deploy: `vercel --prod --archive=tgz` — the `--archive=tgz` flag is required; a plain deploy fails on Vercel's 15,000-file limit

## Getting a change onto Shirley's phone (the whole ritual, every time)
1. If cached assets changed, bump `CACHE` in `web/sw.js` (e.g. `pulsare-v3` → `pulsare-v4`) before deploying
2. Commit and push to main
3. `vercel --prod --archive=tgz`
4. Tell her: force-close the PWA from the app switcher and reopen. If it still looks stale, close and reopen once more — the first open may have loaded before the new service worker took over.

Never say "done" until step 3 succeeded and you've told her step 4.

## Product guardrails (resolve every judgment call toward these)
1. **Track presence, never output.** A day you showed up counts. No outcome is scored.
2. **Brain you have, not the brain you want.** Reduce initiation cost. Fewer decisions before the first action.
3. **Calm, warm, non-judgmental. Never loud, never gamified into pressure.**
4. **Science surfaced briefly, contextually — never as a lecture.** Depth lives in Learn, opt-in.
5. **The voice is ours.** No borrowed influencer or challenge branding, ever.
6. **Scientifically accurate where possible.** An honest, softer claim beats a punchy, overstated one.

Hard rules:
- Never introduce named influencer/challenge branding (Huberman, 75 Hard, Atomic Habits, etc.) into user-facing copy. The science is stated in our own voice.
- Never add outcome/number tracking. Pulsare tracks presence. If a feature scores an outcome, it's out of brand — flag it instead of building it.

## Rules
- UI work: plan first, get approval before building. No unreviewed visual rewrites.
- Work on main unless told otherwise. At session start, check `git status` and flag any unmerged branches or unpushed commits before starting new work.
- End every meaningful session with /wrap-up.
- SETUP.md, CHANGELOG.md, COSMIC_WEB_HANDOVER.md and the various brief/prompt .md files predate this file. On conflict, this file wins.
