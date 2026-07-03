#!/usr/bin/env bash
# Creates the QStash schedule that pings /api/push/tick every 5 minutes.
# Run once, from the repo root:
#
#   vercel env pull .env.vercel --environment=production --yes
#   QSTASH_TOKEN=<paste from console.upstash.com -> QStash> ./scripts/setup-push-schedule.sh
#
# The tick secret is read from the pulled env file; the QStash token is read
# from the environment. Neither is ever printed.

set -euo pipefail

TICK_URL="https://pulsare-peach.vercel.app/api/push/tick"

if [ -z "${QSTASH_TOKEN:-}" ]; then
  echo "error: set QSTASH_TOKEN (console.upstash.com -> QStash -> copy token)" >&2
  exit 1
fi

if [ -f .env.vercel ]; then
  PUSH_TICK_SECRET=$(grep '^PUSH_TICK_SECRET=' .env.vercel | cut -d= -f2- | tr -d '"')
fi
if [ -z "${PUSH_TICK_SECRET:-}" ]; then
  echo "error: PUSH_TICK_SECRET not found. Run: vercel env pull .env.vercel --environment=production --yes" >&2
  exit 1
fi

RESPONSE=$(curl -s -X POST "https://qstash.upstash.io/v2/schedules/${TICK_URL}" \
  -H "Authorization: Bearer ${QSTASH_TOKEN}" \
  -H "Upstash-Cron: */5 * * * *" \
  -H "Upstash-Forward-Authorization: Bearer ${PUSH_TICK_SECRET}")

if echo "$RESPONSE" | grep -q scheduleId; then
  echo "done. QStash will ping the tick endpoint every 5 minutes."
else
  echo "schedule creation failed:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi
