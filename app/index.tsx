import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    hasVerifiedPhone,
    hasGrantedPermissions,
    user,
    isLoading,
  } = useAuthStore();

  if (isLoading) {
    return <LoadingState message="Restoring your session…" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const phoneVerified = hasVerifiedPhone || user?.phoneVerified;
  if (!phoneVerified) {
    return <Redirect href="/(auth)/verify-phone" />;
  }

  if (!hasGrantedPermissions) {
    return <Redirect href="/(auth)/permissions" />;
  }

  return <Redirect href="/(tabs)" />;
}
