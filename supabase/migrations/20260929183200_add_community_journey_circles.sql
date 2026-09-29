alter table public.circles
  add column if not exists journey_mode text not null default 'quit';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circles_journey_mode_check'
      and conrelid = 'public.circles'::regclass
  ) then
    alter table public.circles
      add constraint circles_journey_mode_check
      check (journey_mode in ('quit', 'reduce', 'track'));
  end if;
end
$$;

create index if not exists circles_journey_mode_stage_idx
  on public.circles (journey_mode, min_smoke_free_days);

insert into public.circles (
  id,
  name,
  min_smoke_free_days,
  max_smoke_free_days,
  description,
  journey_mode
)
values
  (
    '00000000-0000-0000-0000-000000000013',
    'Smoke Less',
    0,
    null,
    'Peer support for people reducing how much they smoke.',
    'reduce'
  ),
  (
    '00000000-0000-0000-0000-000000000014',
    'Understand My Smoking',
    0,
    null,
    'Peer support for people tracking patterns without pretending they have quit.',
    'track'
  )
on conflict (id) do update
set
  name = excluded.name,
  min_smoke_free_days = excluded.min_smoke_free_days,
  max_smoke_free_days = excluded.max_smoke_free_days,
  description = excluded.description,
  journey_mode = excluded.journey_mode;
