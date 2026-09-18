import { useEffect, useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { analyticsScreenFromPath } from '@/core/observability/analyticsModel';
import {
  reportOperationalError,
  trackAnalyticsEvent,
} from '@/core/observability/analyticsService';
import {
  Observe,
  ObserveRoot,
  useObserve,
} from '@/core/observability/observe';
import { AppProviders } from '@/core/providers/AppProviders';
import { useAuth } from '@/features/auth/AuthContext';
import {
  addReminderResponseListener,
  configureNotificationPresentation,
} from '@/features/notifications/notificationService';

Observe.configure({
  environment: __DEV__ ? 'development' : 'production',
  dispatchInDebug: process.env.EXPO_PUBLIC_OBSERVE_DEBUG === 'true',
  integrations: {
    'expo-router': {
      filteredParams: [
        'userId',
        'id',
        'token',
        'email',
        'code',
        'sessionId',
        'postId',
        'goalId',
        'articleId',
      ],
    },
  },
});

function RootNavigator() {
  const {
    isReady,
    isAuthenticated,
    user,
    profile,
    authError,
    profileError,
  } = useAuth();
  const pathname = usePathname();
  const { markInteractive } = useObserve();
  const sessionTrackedRef = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const authErrorTrackedRef = useRef(false);
  const profileErrorTrackedRef = useRef(false);

  const canEnterOnboarding =
    isReady && isAuthenticated && !profileError && profile?.onboarding_completed !== true;
  const canEnterApp =
    isReady && isAuthenticated && !profileError && profile?.onboarding_completed === true;

  useEffect(() => {
    if (isReady) markInteractive();
  }, [isReady, markInteractive]);

  useEffect(() => {
    if (!isReady || sessionTrackedRef.current) return;
    sessionTrackedRef.current = true;
    void trackAnalyticsEvent({
      eventName: 'session_started',
      userId: user?.id ?? null,
      journeyMode: profile?.journey_mode ?? null,
    });
  }, [isReady, profile?.journey_mode, user?.id]);

  useEffect(() => {
    if (!canEnterApp) return;

    const screen = analyticsScreenFromPath(pathname);
    if (!screen || lastScreenRef.current === screen) return;
    lastScreenRef.current = screen;

    void trackAnalyticsEvent({
      eventName: 'screen_viewed',
      screen,
      userId: user?.id ?? null,
      journeyMode: profile?.journey_mode ?? null,
    });
  }, [canEnterApp, pathname, profile?.journey_mode, user?.id]);

  useEffect(() => {
    if (!authError || authErrorTrackedRef.current) return;
    authErrorTrackedRef.current = true;
    reportOperationalError('auth_bootstrap');
  }, [authError]);

  useEffect(() => {
    if (!profileError || profileErrorTrackedRef.current) return;
    profileErrorTrackedRef.current = true;
    reportOperationalError('profile_load', {
      userId: user?.id ?? null,
      journeyMode: profile?.journey_mode ?? null,
    });
  }, [profile?.journey_mode, profileError, user?.id]);

  useEffect(() => {
    if (!canEnterApp) return;
    const subscription = addReminderResponseListener((kind) => {
      if (kind === 'daily-checkin') router.push('/(app)/check-in');
      if (kind === 'weekly-reflection') router.push('/(app)/insights');
    });
    return () => subscription?.remove();
  }, [canEnterApp]);

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

function RootLayout() {
  useEffect(() => {
    configureNotificationPresentation();
  }, []);

  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}

export default ObserveRoot.wrap(RootLayout);
