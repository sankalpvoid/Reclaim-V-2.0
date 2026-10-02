-- Reject smoking/craving events dated in the future (beyond small clock skew)
-- and implausible cigarette counts. The app's pickers already block future
-- times; this enforces the same rule server-side for every client (V1 web and V2 native).
-- Non-destructive: no existing rows are rewritten; verified 0 violating rows on 2026-10-02.

create or replace function private.guard_smoking_event()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.smoked_at is not null and new.smoked_at > now() + interval '5 minutes' then
    raise exception 'smoking events cannot be dated in the future'
      using errcode = '22007';
  end if;

  if new.cigarettes is not null and (new.cigarettes < 0 or new.cigarettes > 100) then
    raise exception 'cigarette count must be between 0 and 100'
      using errcode = '22003';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_smoking_event() from public, anon, authenticated;

drop trigger if exists guard_smoking_event on public.smoking_events;
create trigger guard_smoking_event
  before insert or update of smoked_at, cigarettes on public.smoking_events
  for each row execute function private.guard_smoking_event();
