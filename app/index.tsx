import { Redirect } from 'expo-router';
import { isOnboardingComplete, getOnboardingLastScreen } from '@/lib/storage';

const ONBOARDING_ROUTES = [
  '/onboarding/welcome',       // 0
  '/onboarding/name',          // 1
  '/onboarding/mood',          // 2
  '/onboarding/science',       // 3
  '/onboarding/wake-time',     // 4
  '/onboarding/movement',      // 5
  '/onboarding/breathwork',    // 6
  '/onboarding/evening',       // 7
  '/onboarding/custom-habit',  // 8
  '/onboarding/notifications', // 9
  '/onboarding/project',       // 10
  '/onboarding/start-date',    // 11
  '/onboarding/intentions',    // 12
  '/onboarding/handoff',       // 13
] as const;

export default function Index() {
  if (isOnboardingComplete()) {
    return <Redirect href="/(tabs)" />;
  }

  const lastScreen = getOnboardingLastScreen();
  if (lastScreen >= 0 && lastScreen < ONBOARDING_ROUTES.length - 1) {
    return <Redirect href={ONBOARDING_ROUTES[lastScreen + 1] as string} />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
