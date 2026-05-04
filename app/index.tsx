import { Redirect } from 'expo-router';
import { isOnboardingComplete } from '@/lib/storage';

export default function Index() {
  const done = isOnboardingComplete();
  return <Redirect href={done ? '/(tabs)' : '/onboarding/welcome'} />;
}
