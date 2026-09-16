create table if not exists public.learning_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  category text not null check (category in ('cravings','tracking','checkins','community','progress')),
  estimated_minutes integer not null default 3 check (estimated_minutes between 1 and 30),
  journey_modes text[] not null default array['quit','reduce','track']::text[],
  source_name text,
  source_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_articles enable row level security;

drop policy if exists "Authenticated users can read published learning articles" on public.learning_articles;
create policy "Authenticated users can read published learning articles"
on public.learning_articles for select
to authenticated
using (is_published = true);

grant select on public.learning_articles to authenticated;

create table if not exists public.user_learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.learning_articles(id) on delete cascade,
  saved boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.user_learning_progress enable row level security;

create policy "Users can read own learning progress" on public.user_learning_progress for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning progress" on public.user_learning_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning progress" on public.user_learning_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning progress" on public.user_learning_progress for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_learning_progress to authenticated;

insert into public.learning_articles (slug,title,summary,body,category,estimated_minutes,journey_modes,is_published,sort_order)
values
('cravings-are-moments','A craving is a moment, not an instruction','Use a short pause to create space before deciding what comes next.','Cravings can feel urgent, but Reclaim treats them as moments you can observe rather than commands you have to follow.\n\nWhen an urge appears, choose one small interruption: breathe slowly, ride the wave for a few minutes, drink water, or take a short walk. The goal is not to win an argument with yourself. It is simply to put a little time between the urge and the next decision.\n\nLog what happened afterward. Over time, your own feedback can show which tools are worth reaching for first.','cravings',3,array['quit','reduce','track']::text[],true,10),
('honest-logging','Missing data is not success','Honest logs make patterns useful; an empty day should stay unknown unless you confirm it.','Reclaim is designed around one rule: missing information should never be counted as progress.\n\nIf you smoke, log it without trying to make the record look better. If you do not know what happened on a past day, leave it unknown until you can confirm it. That protects your averages, trends, and future insights from becoming misleading.\n\nUseful data does not have to be perfect. It only has to be honest enough to help you notice what is actually changing.','tracking',3,array['reduce','track']::text[],true,20),
('check-in-without-scoring','Check in without grading the day','Mood history is there to notice patterns, not turn feelings into a performance score.','A daily check-in is a small snapshot, not a verdict on whether the day was good or bad.\n\nChoose the answer that is closest to how things feel and add a note only when there is something worth remembering. Skipping a day does not break a streak because Reclaim does not score emotional consistency.\n\nWith enough check-ins, patterns may become visible alongside cravings and smoking logs. Until then, Reclaim should simply keep learning.','checkins',3,array['quit','reduce','track']::text[],true,30),
('community-with-boundaries','Peer support works better with boundaries','Share experience, protect private details, and use block/report controls when you need them.','Community stories are personal experiences, not medical advice. The most useful posts usually describe what happened, what helped, or what someone learned at a similar stage.\n\nAvoid posting phone numbers, addresses, names of other people, or details that could identify someone without their consent. Save useful stories privately, and use block or report controls when a conversation stops feeling safe or supportive.\n\nYou never owe the community a post. Reading quietly is participation too.','community',3,array['quit']::text[],true,40),
('make-progress-visible','Make progress visible without spending it','Savings goals and recovery milestones are reference points; they do not reset what you have already reclaimed.','Reclaim turns time, money, and smoke-free duration into visible reference points because gradual change can be hard to notice day to day.\n\nA savings goal does not create a separate wallet or spend your reclaimed money. It simply compares your current total with something meaningful to you. Health milestones work similarly: they are source-backed timeline estimates, not measurements of your individual body.\n\nUse these markers as context. Your underlying progress continues whether or not you open the screen.','progress',4,array['quit']::text[],true,50)
on conflict (slug) do update set title=excluded.title, summary=excluded.summary, body=excluded.body, category=excluded.category, estimated_minutes=excluded.estimated_minutes, journey_modes=excluded.journey_modes, is_published=excluded.is_published, sort_order=excluded.sort_order, updated_at=now();