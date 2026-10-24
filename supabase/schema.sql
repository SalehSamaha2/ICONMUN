-- =====================================================================
-- ICON MUN  -  database schema  (Supabase / Postgres)
-- Run once in: Supabase > SQL Editor > New query.  Safe to run again.
-- Security lives HERE (Row Level Security), not in the website code.
-- =====================================================================

-- ---------- 1. Admins -------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Is the current logged-in user an organiser?  Every write policy uses this.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------- 2. Content tables (shown on the public site) -------------
create table if not exists public.committees (
  id                 uuid primary key default gen_random_uuid(),
  sort_order         int  not null default 0,
  code               text not null check (char_length(code) between 1 and 60),
  name               text not null check (char_length(name) between 1 and 160),
  icon               text not null default 'shield'
                       check (icon in ('shield','eye','lock','activity','landmark')),
  topic              text not null default '' check (char_length(topic) <= 300),
  level              text not null default 'TBA' check (char_length(level) <= 60),
  seats              text not null default 'Seats TBA' check (char_length(seats) <= 60),
  charter            text not null default '' check (char_length(charter) <= 2000),
  focus_questions    text[] not null default '{}',
  key_countries      text[] not null default '{}',
  background_overview text not null default '' check (char_length(background_overview) <= 3000),
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.schedule_days (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  day_number   int  not null default 1 check (day_number between 1 and 30),
  day_label    text not null check (char_length(day_label) between 1 and 40),
  day_theme    text not null default '' check (char_length(day_theme) <= 200),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.schedule_events (
  id           uuid primary key default gen_random_uuid(),
  day_id       uuid not null references public.schedule_days(id) on delete cascade,
  sort_order   int  not null default 0,
  time_label   text not null default 'TBA' check (char_length(time_label) <= 60),
  title        text not null check (char_length(title) between 1 and 160),
  location     text not null default '' check (char_length(location) <= 160),
  description  text not null default '' check (char_length(description) <= 600),
  badge        text not null default '' check (char_length(badge) <= 40),
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists schedule_events_day_idx on public.schedule_events(day_id, sort_order);

create table if not exists public.secretariat (
  id              uuid primary key default gen_random_uuid(),
  sort_order      int  not null default 0,
  name            text not null check (char_length(name) between 1 and 120),
  role            text not null check (char_length(role) between 1 and 120),
  image_url       text not null default '' check (char_length(image_url) <= 500),
  quote           text not null default '' check (char_length(quote) <= 600),
  bio             text not null default '' check (char_length(bio) <= 2000),
  is_confirmed    boolean not null default true,
  object_position text not null default 'center' check (char_length(object_position) <= 40),
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Key/value site settings (contact details, social links, registration switch...)
create table if not exists public.settings (
  key        text primary key check (char_length(key) between 1 and 60),
  value      text not null default '' check (char_length(value) <= 1000),
  updated_at timestamptz not null default now()
);

-- ---------- 3. Private: delegate applications ------------------------
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  delegation_type text not null default 'single'
                    check (delegation_type in ('single','double','head')),
  full_name       text not null check (char_length(full_name) between 1 and 120),
  institution     text not null default '' check (char_length(institution) <= 160),
  email           text not null check (char_length(email) between 5 and 160
                                       and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  committee       text not null default 'TBA' check (char_length(committee) <= 80),
  first_country   text not null default 'TBA' check (char_length(first_country) <= 80),
  experience_level text not null default 'TBA' check (char_length(experience_level) <= 80),
  statement       text not null default '' check (char_length(statement) <= 2000),
  status          text not null default 'new'
                    check (status in ('new','reviewing','accepted','waitlisted','rejected')),
  internal_notes  text not null default '' check (char_length(internal_notes) <= 4000)
);
create index if not exists applications_created_idx on public.applications(created_at desc);
create index if not exists applications_email_idx   on public.applications(lower(email));

-- ---------- 4. Audit log (who changed what) --------------------------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  user_email text,
  table_name text not null,
  op         text not null,
  row_id     text,
  summary    text,
  old_data   jsonb,
  new_data   jsonb
);
create index if not exists audit_log_at_idx on public.audit_log(at desc);

-- ---------- 5. Triggers ---------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Strangers can submit an application, but they cannot choose its status,
-- add internal notes, back-date it, flood us, or apply when registration is closed.
create or replace function public.guard_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reg_open text;
begin
  if public.is_admin() then
    return new;                      -- organisers may add applications by hand
  end if;

  select value into reg_open from public.settings where key = 'registration_open';
  if reg_open is not null and lower(reg_open) in ('false','no','0','closed') then
    raise exception 'Registration is currently closed' using errcode = 'P0001';
  end if;

  new.status         := 'new';
  new.internal_notes := '';
  new.created_at     := now();
  new.email          := lower(btrim(new.email));
  new.full_name      := btrim(new.full_name);

  -- at most 3 applications per email address
  if (select count(*) from public.applications where lower(email) = new.email) >= 3 then
    raise exception 'This email has already been used for several applications' using errcode = 'P0001';
  end if;

  -- global flood guard: max 150 public applications per 10 minutes
  if (select count(*) from public.applications
       where created_at > now() - interval '10 minutes') >= 150 then
    raise exception 'Too many applications right now, please try again shortly' using errcode = 'P0001';
  end if;

  return new;
end $$;

-- Records admin writes. Anonymous inserts (applications) are not logged.
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
  if not public.is_admin() then
    return coalesce(new, old);
  end if;

  select email into who from auth.users where id = auth.uid();
  rec   := to_jsonb(coalesce(new, old));
  rid   := coalesce(rec->>'id', rec->>'key', rec->>'user_id');
  summ  := coalesce(rec->>'name', rec->>'title', rec->>'code', rec->>'day_label',
                    rec->>'full_name', rec->>'key', rec->>'email');
  old_j := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  new_j := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;

  -- applications hold personal data: log only the non-personal facts
  if tg_table_name = 'applications' then
    summ  := rec->>'full_name';
    old_j := case when old_j is null then null else jsonb_build_object('status', old_j->>'status') end;
    new_j := case when new_j is null then null else jsonb_build_object('status', new_j->>'status') end;
  end if;

  insert into public.audit_log(user_id, user_email, table_name, op, row_id, summary, old_data, new_data)
  values (auth.uid(), who, tg_table_name, tg_op, rid, summ, old_j, new_j);

  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['committees','schedule_days','schedule_events','secretariat','settings'] loop
    execute format('drop trigger if exists trg_touch on public.%I', t);
    execute format('create trigger trg_touch before update on public.%I
                    for each row execute function public.touch_updated_at()', t);
  end loop;

  foreach t in array array['committees','schedule_days','schedule_events','secretariat','settings','applications','admins'] loop
    execute format('drop trigger if exists trg_audit on public.%I', t);
    execute format('create trigger trg_audit after insert or update or delete on public.%I
                    for each row execute function public.log_change()', t);
  end loop;
end $$;

drop trigger if exists trg_guard_application on public.applications;
create trigger trg_guard_application
  before insert on public.applications
  for each row execute function public.guard_application_insert();

-- ---------- 6. Row Level Security -----------------------------------
alter table public.admins          enable row level security;
alter table public.committees      enable row level security;
alter table public.schedule_days   enable row level security;
alter table public.schedule_events enable row level security;
alter table public.secretariat     enable row level security;
alter table public.settings        enable row level security;
alter table public.applications    enable row level security;
alter table public.audit_log       enable row level security;

-- admins: you may read only your own row (the admin page uses it to check access).
-- Nobody can add admins from the website - only from the SQL Editor (make_admin.sql).
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = auth.uid());

-- public content: everyone reads published rows, only admins write
do $$
declare t text;
begin
  foreach t in array array['committees','schedule_days','schedule_events','secretariat'] loop
    execute format('drop policy if exists %1$I_read on public.%1$I', t);
    execute format('create policy %1$I_read on public.%1$I for select to anon, authenticated
                    using (is_published or public.is_admin())', t);
    execute format('drop policy if exists %1$I_write on public.%1$I', t);
    execute format('create policy %1$I_write on public.%1$I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to anon, authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- applications: the public can INSERT only. Only admins can read / edit / delete.
drop policy if exists applications_insert on public.applications;
create policy applications_insert on public.applications
  for insert to anon, authenticated with check (true);   -- the guard trigger forces safe values
drop policy if exists applications_admin_read on public.applications;
create policy applications_admin_read on public.applications
  for select to authenticated using (public.is_admin());
drop policy if exists applications_admin_update on public.applications;
create policy applications_admin_update on public.applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists applications_admin_delete on public.applications;
create policy applications_admin_delete on public.applications
  for delete to authenticated using (public.is_admin());

-- audit log: admins read it. Nobody writes it directly (the trigger does).
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());

-- ---------- 7. Explicit grants (works even if "auto-expose tables" is off) ----
grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;

grant select on public.committees, public.schedule_days, public.schedule_events,
                public.secretariat, public.settings          to anon, authenticated;
grant insert on public.applications                           to anon, authenticated;

grant insert, update, delete on public.committees, public.schedule_days,
                public.schedule_events, public.secretariat, public.settings to authenticated;
grant select, update, delete on public.applications           to authenticated;
grant select on public.admins, public.audit_log               to authenticated;
grant execute on function public.is_admin()                   to anon, authenticated;

-- ---------- 8. File storage (photos, PDFs) ---------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-files', 'site-files', true, 15728640,
        array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = 15728640,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','application/pdf'];

drop policy if exists site_files_read   on storage.objects;
create policy site_files_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-files');
drop policy if exists site_files_insert on storage.objects;
create policy site_files_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'site-files' and public.is_admin());
drop policy if exists site_files_update on storage.objects;
create policy site_files_update on storage.objects
  for update to authenticated using (bucket_id = 'site-files' and public.is_admin())
  with check (bucket_id = 'site-files' and public.is_admin());
drop policy if exists site_files_delete on storage.objects;
create policy site_files_delete on storage.objects
  for delete to authenticated using (bucket_id = 'site-files' and public.is_admin());
