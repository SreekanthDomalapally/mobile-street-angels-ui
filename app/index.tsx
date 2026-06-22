import { Redirect, type Href } from 'expo-router';
import { LoadingState } from '@/components/common/LoadingState';
import { useOnboardingRoute } from '@/hooks/useOnboardingRoute';

export default function Index() {
  const { href, isLoading } = useOnboardingRoute();

  if (isLoading || !href) {
    return <LoadingState message="Preparing your safety setup…" />;
  }

  return <Redirect href={href as Href} />;
}
