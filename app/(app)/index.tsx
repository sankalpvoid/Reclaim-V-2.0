import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import { TodayScreen } from '@/features/today/TodayScreen';
import { buildReclaimWidgetSnapshot } from '@/features/widgets/widgetModel';
import { syncReclaimGlanceWidget } from '@/features/widgets/widgetSync';

export default function MainAppRoute() {
  const { profile } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;
    syncReclaimGlanceWidget(buildReclaimWidgetSnapshot(profile, now));
  }, [now, profile]);

  return <TodayScreen />;
}
