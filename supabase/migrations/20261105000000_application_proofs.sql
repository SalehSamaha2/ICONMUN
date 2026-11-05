-- ICON MUN: certificate / proof-of-experience images on applications,
-- plus scanner access for the Head of Security.
-- Safe to run more than once. Needs: schema.sql (track_heads, head_track)
-- and 20261102000000_qr_pass_security_scanner.sql (can_scan_event_pass).

-- 1. Where the images are listed on each application ------------------------
alter table public.applications
  add column if not exists proofs text[] not null default '{}';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_proofs_max5') then
    alter table public.applications
      add constraint applications_proofs_max5 check (cardinality(proofs) <= 5);
  end if;
end $$;

-- every listed file must live in this application's own folder
create or replace function public.guard_application_proofs()
returns trigger
language plpgsql
set search_path = public
as $$
declare p text;
begin
  foreach p in array coalesce(new.proofs, '{}') loop
    if left(p, 37) <> new.id::text || '/' or p !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$' then
      raise exception 'Invalid proof file path' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists trg_guard_proofs on public.applications;
create trigger trg_guard_proofs
  before insert or update of proofs on public.applications
  for each row execute function public.guard_application_proofs();

-- 2. Private storage bucket (images only, 5 MB each) ------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-proofs', 'application-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- applicants (not signed in) may only ADD a file into <uuid>/<name>; they can never read, replace or delete
drop policy if exists proofs_insert on storage.objects;
create policy proofs_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'application-proofs'
              and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]{1,80}$');

-- the SG reads and deletes everything; a head reads only files of applications in their own track
drop policy if exists proofs_read on storage.objects;
create policy proofs_read on storage.objects
  for select to authenticated
  using (bucket_id = 'application-proofs' and (
    public.is_admin()
    or exists (select 1 from public.applications a
               where a.id::text = (storage.foldername(name))[1]
                 and public.head_track() is not null
                 and a.track = public.head_track())));

drop policy if exists proofs_delete on storage.objects;
create policy proofs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'application-proofs' and public.is_admin());

-- 3. QR scanner: admins, accepted Security members, and the Head of Security --
create or replace function public.can_scan_event_pass()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  verified_email text;
  email_confirmed timestamptz;
begin
  if auth.uid() is null then
    return false;
  end if;

  select lower(u.email), u.email_confirmed_at
    into verified_email, email_confirmed
  from auth.users u
  where u.id = auth.uid();

  if verified_email is null or email_confirmed is null then
    return false;
  end if;

  if public.is_admin() or public.head_track() = 'security' then
    return true;
  end if;

  return exists (
    select 1
    from public.applications a
    where lower(a.email) = verified_email
      and a.track = 'security'
      and a.status = 'accepted'
  );
end;
$$;

revoke all on function public.can_scan_event_pass() from public, anon;
grant execute on function public.can_scan_event_pass() to authenticated;
