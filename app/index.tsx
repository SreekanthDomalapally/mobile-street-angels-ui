import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { useOnboardingRoute } from '@/hooks/useOnboardingRoute';

export default function Index() {
  const router = useRouter();
  const { href, isLoading } = useOnboardingRoute();
  const lastHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !href) return;
    if (lastHrefRef.current === href) return;
    lastHrefRef.current = href;
    router.replace(href as Href);
  }, [href, isLoading, router]);

  return <LoadingState message="Preparing your safety setup…" />;
}
