import Constants from 'expo-constants';
import { Observe } from '@/core/observability/observe';
import { Platform } from 'react-native';

import { supabase } from '@/core/supabase/client';
import {
  analyticsJourneyModeSchema,
  analyticsPlatform,
  analyticsScreenSchema,
  clientErrorOperationSchema,
  type AnalyticsJourneyMode,
  type AnalyticsScreen,
  type ClientErrorOperation,
} from './analyticsModel';

type AnalyticsIdentity = {
  userId?: string | null;
  journeyMode?: AnalyticsJourneyMode | null;
};

type AnalyticsEvent =
  | ({ eventName: 'session_started' } & AnalyticsIdentity)
  | ({ eventName: 'screen_viewed'; screen: AnalyticsScreen } & AnalyticsIdentity)
  | ({ eventName: 'client_error'; operation: ClientErrorOperation } & AnalyticsIdentity);

const debugAnalyticsEnabled =
  process.env.EXPO_PUBLIC_ANALYTICS_DEBUG === 'true';
const appVersion = Constants.expoConfig?.version ?? 'unknown';
const platform = analyticsPlatform(Platform.OS);

function createAnalyticsUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    const value = token === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const sessionId = createAnalyticsUuid();

function anonymousId(): string {
  const observeClientId = Observe.clientId;
  if (
    typeof observeClientId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      observeClientId,
    )
  ) {
    return observeClientId;
  }
  return sessionId;
}

function shouldSendAnalytics(): boolean {
  return !__DEV__ || debugAnalyticsEnabled;
}

function safeProperties(event: AnalyticsEvent): Record<string, string> {
  const base = {
    platform,
    app_version: appVersion,
  };

  if (event.eventName === 'screen_viewed') {
    return {
      ...base,
      screen: analyticsScreenSchema.parse(event.screen),
    };
  }

  if (event.eventName === 'client_error') {
    return {
      ...base,
      operation: clientErrorOperationSchema.parse(event.operation),
    };
  }

  return base;
}

export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  if (!shouldSendAnalytics()) return;

  const journeyMode = event.journeyMode
    ? analyticsJourneyModeSchema.parse(event.journeyMode)
    : null;

  const { error } = await supabase.from('analytics_events').insert({
    client_created_at: new Date().toISOString(),
    user_id: event.userId ?? null,
    anonymous_id: anonymousId(),
    session_id: sessionId,
    event_name: event.eventName,
    journey_mode: journeyMode,
    properties: safeProperties(event),
  });

  if (error && __DEV__) {
    console.warn('Reclaim analytics event was not recorded.', error.code);
  }
}
