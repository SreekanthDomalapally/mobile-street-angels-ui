import { LoadingState } from '@/components/common/LoadingState';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding, hasGrantedPermissions, isLoading } =
    useAuthStore();

  if (isLoading) {
    return <LoadingState message="Restoring your session…" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasGrantedPermissions) {
    return <Redirect href="/(auth)/permissions" />;
  }

  return <Redirect href="/(tabs)" />;
}
