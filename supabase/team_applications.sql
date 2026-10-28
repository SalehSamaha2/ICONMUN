-- =====================================================================
-- ICON MUN  -  team applications + registration windows
-- Run once in: Supabase > SQL Editor > New query.  Safe to run again.
-- Adds: registration_tracks (delegate / volunteer / security / media, each with
-- its own on/off switch and optional open/close dates), and two new columns on
-- applications (track, details). Replaces the old single "registration_open" switch.
-- =====================================================================

-- ---------- 1. Registration tracks ------------------------------------
create table if not exists public.registration_tracks (
  key          text primary key check (key in ('delegate','volunteer','security','media')),
  title        text not null check (char_length(title) between 1 and 80),
  description  text not null default '' check (char_length(description) <= 300),
  is_open      boolean not null default false,          -- master switch
  opens_at     timestamptz,                             -- optional: not before this moment
  closes_at    timestamptz,                             -- optional: not after this moment
  closed_label text not null default 'Closed' check (char_length(closed_label) between 1 and 30),
  sort_order   int not null default 0,
  updated_at   timestamptz not null default now(),
  constraint registration_window_order check (opens_at is null or closes_at is null or closes_at > opens_at)
);

-- Seed the four tracks. Delegates keep whatever the old switch said; team tracks start closed.
insert into public.registration_tracks (key, title, description, is_open, sort_order)
values
  ('delegate',  'Delegate',  'Represent a nation in one of the councils.', 
     coalesce((select lower(value) not in ('false','no','0','closed') from public.settings where key = 'registration_open'), true), 0),
  ('volunteer', 'Volunteer', 'Help run the conference: registration desk, logistics and delegate care.', false, 1),
  ('security',  'Security',  'Keep the venue safe and the flow of people orderly.', false, 2),
  ('media',     'Media',     'Photography, video, design and social media coverage.', false, 3)
on conflict (key) do nothing;

-- Is this track accepting applications right now? (switch on AND inside its dates)
create or replace function public.track_is_open(t text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select r.is_open
       and (r.opens_at  is null or r.opens_at  <= now())
       and (r.closes_at is null or r.closes_at >  now())
    from public.registration_tracks r where r.key = t
  ), false);
$$;
grant execute on function public.track_is_open(text) to anon, authenticated;

-- ---------- 2. Applications: which track + the extra answers ----------
alter table public.applications add column if not exists track text not null default 'delegate';
alter table public.applications add column if not exists details jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'applications_track_check') then
    alter table public.applications add constraint applications_track_check
      check (track in ('delegate','volunteer','security','media'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'applications_details_size') then
    alter table public.applications add constraint applications_details_size
      check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 3000);
  end if;
end $$;
create index if not exists applications_track_idx on public.applications(track, created_at desc);

-- ---------- 3. Guard: strangers may only apply to a track that is open ----
create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;                      -- organisers may add applications by hand
  end if;

  if not public.track_is_open(new.track) then
    raise exception 'Registration is currently closed' using errcode = 'P0001';
  end if;

  new.status         := 'new';
  new.internal_notes := '';
  new.created_at     := now();
  new.email          := lower(btrim(new.email));
  new.full_name      := btrim(new.full_name);

  -- at most 3 applications per email address, per track
  if (select count(*) from public.applications
       where lower(email) = new.email and track = new.track) >= 3 then
    raise exception 'This email has already been used for several applications' using errcode = 'P0001';
  end if;

  -- global flood guard: max 150 public applications per 10 minutes
  if (select count(*) from public.applications
       where created_at > now() - interval '10 minutes') >= 150 then
    raise exception 'Too many applications right now, please try again shortly' using errcode = 'P0001';
  end if;

  return new;
end $$;

-- ---------- 4. Triggers, security, grants for the new table ------------
drop trigger if exists trg_touch on public.registration_tracks;
create trigger trg_touch before update on public.registration_tracks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_audit on public.registration_tracks;
create trigger trg_audit after insert or update or delete on public.registration_tracks
  for each row execute function public.log_change();

alter table public.registration_tracks enable row level security;

drop policy if exists tracks_read on public.registration_tracks;
create policy tracks_read on public.registration_tracks
  for select to anon, authenticated using (true);
drop policy if exists tracks_write on public.registration_tracks;
create policy tracks_write on public.registration_tracks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.registration_tracks to anon, authenticated;
grant insert, update, delete on public.registration_tracks to authenticated;
