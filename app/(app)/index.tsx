import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { SmokingEvent } from '@/domain/smoking/smokingEvents';
import { useAuth } from '@/features/auth/AuthContext';
import { TodayScreen } from '@/features/today/TodayScreen';
import {
  getReductionPlan,
  getSmokingEvents,
  todayKeys,
} from '@/features/today/todayService';
import { buildReclaimWidgetSnapshot } from '@/features/widgets/widgetModel';
import { syncReclaimGlanceWidget } from '@/features/widgets/widgetSync';

export default function MainAppRoute() {
  const { user, profile } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const userId = user?.id ?? '';
  const mode = profile?.journey_mode ?? 'quit';

  const smokingEventsQuery = useQuery({
    queryKey: todayKeys.smokingEvents(userId),
    queryFn: () => getSmokingEvents(userId),
    enabled: Boolean(userId) && mode !== 'quit',
  });

  const reductionPlanQuery = useQuery({
    queryKey: todayKeys.reductionPlan(userId),
    queryFn: () => getReductionPlan(userId),
    enabled: Boolean(userId) && mode === 'reduce',
  });

  const widgetSmokingEvents = useMemo<SmokingEvent[] | undefined>(
    () =>
      smokingEventsQuery.data?.map((row) => ({
        id: row.id,
        smokedAt: row.smoked_at,
        cigarettes: row.cigarettes,
      })),
    [smokingEventsQuery.data],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;
    syncReclaimGlanceWidget(
      buildReclaimWidgetSnapshot(profile, now, {
        smokingEvents: widgetSmokingEvents,
        reductionTarget:
          mode === 'reduce'
            ? reductionPlanQuery.data?.current_target ?? profile.daily_target ?? null
            : null,
      }),
    );
  }, [mode, now, profile, reductionPlanQuery.data?.current_target, widgetSmokingEvents]);

  return <TodayScreen now={now} />;
}
