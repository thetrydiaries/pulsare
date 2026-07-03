#!/usr/bin/env bash
# Creates the QStash schedule that pings /api/push/tick every 5 minutes.
# Already run once (2026-07-03); only needed again if the schedule is deleted.
#
#   QSTASH_TOKEN=<from a vercel env pull> PUSH_TICK_SECRET=<the secret> ./scripts/setup-push-schedule.sh
#
# Note: Vercel env vars marked "sensitive" (PUSH_TICK_SECRET is one) pull as
# empty strings — pass PUSH_TICK_SECRET via the environment instead. Neither
# value is ever printed.

set -euo pipefail

TICK_URL="https://pulsare-peach.vercel.app/api/push/tick"

if [ -z "${QSTASH_TOKEN:-}" ]; then
  echo "error: set QSTASH_TOKEN (console.upstash.com -> QStash -> copy token)" >&2
  exit 1
fi

if [ -z "${PUSH_TICK_SECRET:-}" ]; then
  echo "error: set PUSH_TICK_SECRET (sensitive vars pull as empty — pass it via the environment)" >&2
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
