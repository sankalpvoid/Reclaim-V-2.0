create index if not exists user_learning_progress_article_idx
  on public.user_learning_progress (article_id);

alter policy "Users can delete own learning progress"
  on public.user_learning_progress
  using ((select auth.uid()) = user_id);

alter policy "Users can insert own learning progress"
  on public.user_learning_progress
  with check ((select auth.uid()) = user_id);

alter policy "Users can read own learning progress"
  on public.user_learning_progress
  using ((select auth.uid()) = user_id);

alter policy "Users can update own learning progress"
  on public.user_learning_progress
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "moderators delete replies" on public.post_replies;
drop policy if exists "users delete own replies" on public.post_replies;

create policy "users or moderators delete replies"
  on public.post_replies
  for delete
  to authenticated
  using (
    ((select auth.uid()) = user_id)
    or private.is_community_moderator()
  );
