import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/core/providers/AppProviders';
import { useAuth } from '@/features/auth/AuthContext';

function RootNavigator() {
  const { isReady, isAuthenticated, profile, profileError } = useAuth();
  const canEnterOnboarding =
    isReady && isAuthenticated && !profileError && profile?.onboarding_completed !== true;
  const canEnterApp =
    isReady && isAuthenticated && !profileError && profile?.onboarding_completed === true;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isReady && !isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={canEnterOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={canEnterApp}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}
