-- ICON MUN: admin-account QR passes (FIXED copy: adds '#variable_conflict use_column'
-- so output-column names like application_id / inside / checked_in_at no longer clash
-- with real table columns inside the functions).
-- ICON MUN: issue a personal QR pass to organiser accounts that do not have
-- an accepted application. Applicant passes remain unchanged.
-- Apply after 20261102000000_qr_pass_security_scanner.sql.

create table if not exists public.event_account_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inside boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  last_scanned_at timestamptz,
  last_scanned_by uuid references auth.users(id) on delete set null,
  last_direction text check (last_direction in ('entry', 'exit'))
);

create index if not exists event_account_passes_inside_idx
  on public.event_account_passes (inside, last_scanned_at desc);

alter table public.event_account_passes enable row level security;
revoke all on public.event_account_passes from anon, authenticated;

alter table public.event_pass_scan_logs
  add column if not exists account_pass_id uuid references public.event_account_passes(id) on delete set null;

create or replace function public.my_event_passes()
returns table (
  application_id uuid,
  created_at timestamptz,
  full_name text,
  email text,
  track text,
  status text,
  committee text,
  role text,
  pass_token uuid,
  inside boolean,
  checked_in_at timestamptz,
  last_scanned_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
#variable_conflict use_column
declare
  verified_email text;
  email_confirmed timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first' using errcode = '42501';
  end if;

  select lower(u.email), u.email_confirmed_at
    into verified_email, email_confirmed
  from auth.users u
  where u.id = auth.uid();

  if verified_email is null or email_confirmed is null then
    raise exception 'Verify your email address before accessing a pass' using errcode = '42501';
  end if;

  insert into public.event_passes(application_id)
  select a.id
  from public.applications a
  where lower(a.email) = verified_email
    and a.status = 'accepted'
  on conflict (application_id) do nothing;

  -- Admins with an accepted application use that application pass. Admins
  -- without one (including pending/no-application admin accounts) get an
  -- organiser pass tied to their authenticated account.
  if public.is_admin() and not exists (
    select 1 from public.applications a
    where lower(a.email) = verified_email and a.status = 'accepted'
  ) then
    insert into public.event_account_passes(user_id)
    values (auth.uid())
    on conflict (user_id) do nothing;
  end if;

  return query
  select
    a.id,
    a.created_at,
    a.full_name,
    a.email,
    a.track,
    a.status,
    a.committee,
    case
      when a.track = 'delegate' then a.committee
      else coalesce(a.details ->> 'focus', a.track)
    end,
    case when a.status = 'accepted' then p.token else null::uuid end,
    coalesce(p.inside, false),
    p.checked_in_at,
    p.last_scanned_at
  from public.applications a
  left join public.event_passes p on p.application_id = a.id
  where lower(a.email) = verified_email
  order by a.created_at desc;

  return query
  select
    auth.uid(),
    ep.created_at,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      split_part(u.email, '@', 1),
      'ICON MUN Administrator'
    ),
    u.email,
    'admin'::text,
    'accepted'::text,
    ''::text,
    'Administrator'::text,
    ep.token,
    ep.inside,
    ep.checked_in_at,
    ep.last_scanned_at
  from public.event_account_passes ep
  join auth.users u on u.id = ep.user_id
  where ep.user_id = auth.uid()
    and public.is_admin()
    and not exists (
      select 1 from public.applications a
      where lower(a.email) = verified_email and a.status = 'accepted'
    );
end;
$$;

revoke all on function public.my_event_passes() from public, anon;
grant execute on function public.my_event_passes() to authenticated;

create or replace function public.scan_event_pass(p_token text, p_direction text)
returns table (
  ok boolean,
  name text,
  email text,
  track text,
  role text,
  inside boolean,
  checked_in_at timestamptz,
  last_scanned_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
#variable_conflict use_column
declare
  pass_row public.event_passes%rowtype;
  account_pass_row public.event_account_passes%rowtype;
  app_row public.applications%rowtype;
  account_user auth.users%rowtype;
  scan_time timestamptz := now();
  clean_direction text := lower(coalesce(p_direction, ''));
begin
  if not public.can_scan_event_pass() then
    raise exception 'Scanner access is restricted to ICON MUN admins and accepted Security team members'
      using errcode = '42501';
  end if;

  if clean_direction not in ('entry', 'exit') then
    return query select false, null::text, null::text, null::text, null::text,
      false, null::timestamptz, null::timestamptz, 'Choose entry or exit';
    return;
  end if;

  if p_token is null or p_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    insert into public.event_pass_scan_logs(scanner_user_id, direction, outcome, reason)
    values (auth.uid(), clean_direction, 'denied', 'Invalid pass code');
    return query select false, null::text, null::text, null::text, null::text,
      false, null::timestamptz, null::timestamptz, 'Invalid pass code';
    return;
  end if;

  select ep.* into pass_row
  from public.event_passes ep
  where ep.token = p_token::uuid
  for update;

  if not found then
    select ep.* into account_pass_row
    from public.event_account_passes ep
    where ep.token = p_token::uuid
    for update;

    if not found then
      insert into public.event_pass_scan_logs(scanner_user_id, direction, outcome, reason)
      values (auth.uid(), clean_direction, 'denied', 'Pass not found');
      return query select false, null::text, null::text, null::text, null::text,
        false, null::timestamptz, null::timestamptz, 'Pass not found';
      return;
    end if;

    select u.* into account_user
    from auth.users u
    where u.id = account_pass_row.user_id;

    if clean_direction = 'entry' and account_pass_row.inside then
      insert into public.event_pass_scan_logs(account_pass_id, scanner_user_id, direction, outcome, reason)
      values (account_pass_row.id, auth.uid(), clean_direction, 'denied', 'Already inside');
      return query select false,
        coalesce(nullif(account_user.raw_user_meta_data ->> 'full_name', ''), nullif(account_user.raw_user_meta_data ->> 'name', ''), split_part(account_user.email, '@', 1)),
        account_user.email, 'admin'::text, 'Administrator'::text, true,
        account_pass_row.checked_in_at, account_pass_row.last_scanned_at, 'This administrator is already checked in';
      return;
    end if;

    if clean_direction = 'exit' and not account_pass_row.inside then
      insert into public.event_pass_scan_logs(account_pass_id, scanner_user_id, direction, outcome, reason)
      values (account_pass_row.id, auth.uid(), clean_direction, 'denied', 'Not currently inside');
      return query select false,
        coalesce(nullif(account_user.raw_user_meta_data ->> 'full_name', ''), nullif(account_user.raw_user_meta_data ->> 'name', ''), split_part(account_user.email, '@', 1)),
        account_user.email, 'admin'::text, 'Administrator'::text, false,
        account_pass_row.checked_in_at, account_pass_row.last_scanned_at, 'This administrator is not currently checked in';
      return;
    end if;

    update public.event_account_passes
    set inside = (clean_direction = 'entry'),
        checked_in_at = case when clean_direction = 'entry' then scan_time else checked_in_at end,
        checked_in_by = case when clean_direction = 'entry' then auth.uid() else checked_in_by end,
        last_scanned_at = scan_time,
        last_scanned_by = auth.uid(),
        last_direction = clean_direction
    where id = account_pass_row.id
    returning * into account_pass_row;

    insert into public.event_pass_scan_logs(account_pass_id, scanner_user_id, direction, outcome)
    values (account_pass_row.id, auth.uid(), clean_direction, 'allowed');

    return query select true,
      coalesce(nullif(account_user.raw_user_meta_data ->> 'full_name', ''), nullif(account_user.raw_user_meta_data ->> 'name', ''), split_part(account_user.email, '@', 1)),
      account_user.email, 'admin'::text, 'Administrator'::text,
      account_pass_row.inside, account_pass_row.checked_in_at, account_pass_row.last_scanned_at,
      case when clean_direction = 'entry' then 'Administrator entry recorded successfully' else 'Administrator exit recorded successfully' end;
    return;
  end if;

  select a.* into app_row
  from public.applications a
  where a.id = pass_row.application_id;

  if not found or app_row.status <> 'accepted' then
    insert into public.event_pass_scan_logs(pass_id, scanner_user_id, direction, outcome, reason)
    values (pass_row.id, auth.uid(), clean_direction, 'denied', 'Application is not accepted');
    return query select false, app_row.full_name, app_row.email, app_row.track,
      nullif(app_row.details ->> 'focus', ''), coalesce(pass_row.inside, false),
      pass_row.checked_in_at, pass_row.last_scanned_at, 'Application is not accepted';
    return;
  end if;

  if clean_direction = 'entry' and pass_row.inside then
    insert into public.event_pass_scan_logs(pass_id, scanner_user_id, direction, outcome, reason)
    values (pass_row.id, auth.uid(), clean_direction, 'denied', 'Already inside');
    return query select false, app_row.full_name, app_row.email, app_row.track,
      case when app_row.track = 'delegate' then app_row.committee else coalesce(app_row.details ->> 'focus', app_row.track) end,
      true, pass_row.checked_in_at, pass_row.last_scanned_at, 'This person is already checked in';
    return;
  end if;

  if clean_direction = 'exit' and not pass_row.inside then
    insert into public.event_pass_scan_logs(pass_id, scanner_user_id, direction, outcome, reason)
    values (pass_row.id, auth.uid(), clean_direction, 'denied', 'Not currently inside');
    return query select false, app_row.full_name, app_row.email, app_row.track,
      case when app_row.track = 'delegate' then app_row.committee else coalesce(app_row.details ->> 'focus', app_row.track) end,
      false, pass_row.checked_in_at, pass_row.last_scanned_at, 'This person is not currently checked in';
    return;
  end if;

  update public.event_passes
  set inside = (clean_direction = 'entry'),
      checked_in_at = case when clean_direction = 'entry' then scan_time else checked_in_at end,
      checked_in_by = case when clean_direction = 'entry' then auth.uid() else checked_in_by end,
      last_scanned_at = scan_time,
      last_scanned_by = auth.uid(),
      last_direction = clean_direction
  where id = pass_row.id
  returning * into pass_row;

  insert into public.event_pass_scan_logs(pass_id, scanner_user_id, direction, outcome)
  values (pass_row.id, auth.uid(), clean_direction, 'allowed');

  return query select true, app_row.full_name, app_row.email, app_row.track,
    case when app_row.track = 'delegate' then app_row.committee else coalesce(app_row.details ->> 'focus', app_row.track) end,
    pass_row.inside, pass_row.checked_in_at, pass_row.last_scanned_at,
    case when clean_direction = 'entry' then 'Entry recorded successfully' else 'Exit recorded successfully' end;
end;
$$;

revoke all on function public.scan_event_pass(text, text) from public, anon;
grant execute on function public.scan_event_pass(text, text) to authenticated;

create or replace function public.list_event_checkins()
returns table (
  application_id uuid,
  full_name text,
  email text,
  track text,
  role text,
  checked_in_at timestamptz,
  last_scanned_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.can_scan_event_pass() then
    raise exception 'Scanner access required' using errcode = '42501';
  end if;

  return query
  select a.id, a.full_name, a.email, a.track,
    case when a.track = 'delegate' then a.committee else coalesce(a.details ->> 'focus', a.track) end,
    p.checked_in_at, p.last_scanned_at
  from public.event_passes p
  join public.applications a on a.id = p.application_id
  where p.inside = true and a.status = 'accepted'
  union all
  select u.id,
    coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
    u.email, 'admin'::text, 'Administrator'::text, ep.checked_in_at, ep.last_scanned_at
  from public.event_account_passes ep
  join auth.users u on u.id = ep.user_id
  where ep.inside = true
  order by 7 desc nulls last;
end;
$$;

revoke all on function public.list_event_checkins() from public, anon;
grant execute on function public.list_event_checkins() to authenticated;

create or replace function public.list_event_scan_logs()
returns table (
  full_name text,
  email text,
  track text,
  direction text,
  outcome text,
  reason text,
  scanner_email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.can_scan_event_pass() then
    raise exception 'Scanner access required' using errcode = '42501';
  end if;

  return query
  select
    coalesce(a.full_name,
      nullif(u_pass.raw_user_meta_data ->> 'full_name', ''),
      nullif(u_pass.raw_user_meta_data ->> 'name', ''),
      split_part(u_pass.email, '@', 1)),
    coalesce(a.email, u_pass.email),
    coalesce(a.track, case when ep.account_pass_id is not null then 'admin' end),
    ep.direction, ep.outcome, ep.reason, u_scanner.email, ep.created_at
  from public.event_pass_scan_logs ep
  left join public.event_passes p on p.id = ep.pass_id
  left join public.applications a on a.id = p.application_id
  left join public.event_account_passes ap on ap.id = ep.account_pass_id
  left join auth.users u_pass on u_pass.id = ap.user_id
  left join auth.users u_scanner on u_scanner.id = ep.scanner_user_id
  order by ep.created_at desc
  limit 100;
end;
$$;

revoke all on function public.list_event_scan_logs() from public, anon;
grant execute on function public.list_event_scan_logs() to authenticated;
