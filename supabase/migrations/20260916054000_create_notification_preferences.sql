create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_checkin_enabled boolean not null default false,
  daily_checkin_hour smallint not null default 20 check (daily_checkin_hour between 0 and 23),
  daily_checkin_minute smallint not null default 0 check (daily_checkin_minute between 0 and 59),
  weekly_reflection_enabled boolean not null default false,
  weekly_reflection_weekday smallint not null default 1 check (weekly_reflection_weekday between 1 and 7),
  weekly_reflection_hour smallint not null default 19 check (weekly_reflection_hour between 0 and 23),
  weekly_reflection_minute smallint not null default 0 check (weekly_reflection_minute between 0 and 59),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "users read own notification preferences"
on public.notification_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users create own notification preferences"
on public.notification_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own notification preferences"
on public.notification_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.notification_preferences to authenticated;
