import { Redirect } from 'expo-router';
import {
  isOnboardingComplete,
  getOnboardingLastScreen,
  getOnboardingFlowVersion,
  ONBOARDING_FLOW_VERSION,
} from '@/lib/storage';

const ONBOARDING_ROUTES = [
  '/onboarding/welcome',       // 0
  '/onboarding/name',          // 1
  '/onboarding/wake-time',     // 2
  '/onboarding/movement',      // 3
  '/onboarding/evening',       // 4
  '/onboarding/notifications', // 5
  '/onboarding/handoff',       // 6
] as const;

export default function Index() {
  if (isOnboardingComplete()) {
    return <Redirect href="/(tabs)" />;
  }

  // Only trust saved progress if it came from the current flow version. Stale
  // progress from an older screen sequence would resolve to the wrong screen
  // (e.g. silently skipping wake-time), so discard it and restart at welcome.
  const lastScreen = getOnboardingLastScreen();
  const flowCurrent = getOnboardingFlowVersion() === ONBOARDING_FLOW_VERSION;
  if (flowCurrent && lastScreen >= 0 && lastScreen < ONBOARDING_ROUTES.length - 1) {
    return <Redirect href={ONBOARDING_ROUTES[lastScreen + 1] as string} />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
