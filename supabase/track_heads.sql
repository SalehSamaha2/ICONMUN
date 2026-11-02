-- =====================================================================
--  ICON MUN 2027 - Heads of volunteers / security / media
--  Run once in Supabase > SQL Editor. Safe to run again.
--
--  A head signs in at /admin and sees ONLY the applications of their own
--  track. They can set a "head's decision" and write notes. They cannot
--  change anything else, delete anything, or read any other table.
--  The SG (in `admins`) is untouched and keeps full access.
-- =====================================================================

-- 1. Who is a head, and of which track (one row per head account)
create table if not exists public.track_heads (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  track      text not null check (track in ('volunteer','security','media')),
  created_at timestamptz not null default now()
);

-- 2. The head's own (non-final) verdict + notes, kept apart from the SG's final status
alter table public.applications add column if not exists head_decision    text
  check (head_decision in ('reviewing','accepted','waitlisted','rejected'));
alter table public.applications add column if not exists head_decision_by text;
alter table public.applications add column if not exists head_decision_at timestamptz;
alter table public.applications add column if not exists head_notes       text not null default ''
  check (char_length(head_notes) <= 4000);

-- 3. Which track does the current user head? (null for everyone else)
create or replace function public.head_track()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select h.track from public.track_heads h where h.user_id = auth.uid();
$$;

-- 4. Row Level Security
alter table public.track_heads enable row level security;
drop policy if exists track_heads_self_read on public.track_heads;
create policy track_heads_self_read on public.track_heads
  for select to authenticated using (user_id = auth.uid());

drop policy if exists applications_head_read on public.applications;
create policy applications_head_read on public.applications
  for select to authenticated
  using (public.head_track() is not null and track = public.head_track());

drop policy if exists applications_head_update on public.applications;
create policy applications_head_update on public.applications
  for update to authenticated
  using      (public.head_track() is not null and track = public.head_track())
  with check (public.head_track() is not null and track = public.head_track());
-- (no delete policy for heads: only the SG can delete)

revoke all on public.track_heads from anon, authenticated;
grant select on public.track_heads to authenticated;
grant execute on function public.head_track() to authenticated;

-- 5. Column guard: a head may change ONLY head_decision and head_notes
create or replace function public.guard_head_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  skip text[] := array['head_decision','head_decision_by','head_decision_at','head_notes'];
begin
  -- SQL Editor (no logged-in user) and the SG are not restricted
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if public.head_track() is null then
    raise exception 'Not allowed';
  end if;
  if (to_jsonb(new) - skip) is distinct from (to_jsonb(old) - skip) then
    raise exception 'Heads can only change the head decision and head notes';
  end if;
  if new.head_decision is distinct from old.head_decision then
    new.head_decision_by := (select email from auth.users where id = auth.uid());
    new.head_decision_at := now();
  else
    new.head_decision_by := old.head_decision_by;
    new.head_decision_at := old.head_decision_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_head_update on public.applications;
create trigger trg_guard_head_update
  before update on public.applications
  for each row execute function public.guard_head_update();

-- 6. Activity log: also record what heads do (only the SG can read the log)
create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec     jsonb;
  old_j   jsonb;
  new_j   jsonb;
  who     text;
  rid     text;
  summ    text;
begin
  if not (public.is_admin() or public.head_track() is not null) then
    return coalesce(new, old);
  end if;

  select email into who from auth.users where id = auth.uid();
  rec   := to_jsonb(coalesce(new, old));
  rid   := coalesce(rec->>'id', rec->>'key', rec->>'user_id');
  summ  := coalesce(rec->>'name', rec->>'title', rec->>'code', rec->>'day_label',
                    rec->>'full_name', rec->>'key', rec->>'email');
  old_j := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  new_j := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;

  if tg_table_name = 'applications' then
    summ  := rec->>'full_name';
    old_j := case when old_j is null then null else
             jsonb_build_object('status', old_j->>'status', 'head_decision', old_j->>'head_decision') end;
    new_j := case when new_j is null then null else
             jsonb_build_object('status', new_j->>'status', 'head_decision', new_j->>'head_decision') end;
  end if;

  insert into public.audit_log(user_id, user_email, table_name, op, row_id, summary, old_data, new_data)
  values (auth.uid(), who, tg_table_name, tg_op, rid, summ, old_j, new_j);

  return coalesce(new, old);
end $$;

-- =====================================================================
--  Add a head (create the user first in Authentication > Users):
--
--    insert into public.track_heads (user_id, email, track)
--    select id, email, 'security' from auth.users where email = 'head@example.com';
--
--  track is one of: volunteer, security, media
--  Remove a head:  delete from public.track_heads where email = 'head@example.com';
-- =====================================================================
