import '../global.css';
import '@/lib/perf';
import '@/services/backgroundLocation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { AppProviders } from '@/providers/AppProviders';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAuthBootstrap } from '@/hooks/useAuth';
import { useLocationSync } from '@/hooks/useLocationSync';
import { useNotificationRouting } from '@/hooks/useNotificationRouting';

export { AppErrorBoundary as ErrorBoundary } from '@/components/common/AppErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded, fontError } = useAppFonts();
  useAuthBootstrap();
  useNotificationRouting();
  useLocationSync();

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts] Failed to load app fonts:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="sos/active"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="alert/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="responder-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group/emergency-types" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="trip/start" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="trip/active"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="trip/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AppProviders>
  );
}
