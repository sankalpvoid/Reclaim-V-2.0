create policy "daily checkins update own"
on public.daily_checkins
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
