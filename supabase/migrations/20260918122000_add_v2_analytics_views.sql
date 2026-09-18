create or replace view public.analytics_v2_daily_events
with (security_invoker = true)
as
select
  date_trunc('day', occurred_at)::date as event_day,
  event_name,
  count(*)::bigint as events,
  count(distinct coalesce(user_id::text, anonymous_id::text))::bigint as actors
from public.analytics_events
where properties ->> 'client_generation' = 'v2'
group by 1, 2;

create or replace view public.analytics_v2_daily_screens
with (security_invoker = true)
as
select
  date_trunc('day', occurred_at)::date as event_day,
  properties ->> 'screen' as screen,
  count(*)::bigint as views,
  count(distinct coalesce(user_id::text, anonymous_id::text))::bigint as actors
from public.analytics_events
where event_name = 'screen_viewed'
  and properties ->> 'client_generation' = 'v2'
  and properties ? 'screen'
group by 1, 2;

revoke all on public.analytics_v2_daily_events from anon, authenticated;
revoke all on public.analytics_v2_daily_screens from anon, authenticated;

comment on view public.analytics_v2_daily_events is
  'Internal V2 aggregate only. No raw text or user-generated content. Query from trusted admin/service contexts.';
comment on view public.analytics_v2_daily_screens is
  'Internal V2 screen aggregate only. Screen values come from the fixed Reclaim V2 allowlist.';
