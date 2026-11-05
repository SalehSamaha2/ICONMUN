-- ICON MUN: certificate / proof image is now REQUIRED on every new application.
-- Enforced in the database so it cannot be skipped by editing the page.
-- Existing applications are not touched. SQL Editor and the SG are exempt.
--
-- IMPORTANT: run this only AFTER the website with the upload box is live,
-- otherwise the old site (no upload box) could not submit applications.
-- Safe to run more than once.

create or replace function public.guard_application_proofs()
returns trigger
language plpgsql
set search_path = public
as $$
declare p text;
begin
  if tg_op = 'INSERT'
     and current_user in ('anon', 'authenticated')
     and not public.is_admin()
     and cardinality(coalesce(new.proofs, '{}')) = 0 then
    raise exception 'Please attach at least one certificate or proof image' using errcode = 'P0001';
  end if;

  foreach p in array coalesce(new.proofs, '{}') loop
    if left(p, 37) <> new.id::text || '/' or p !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$' then
      raise exception 'Invalid proof file path' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;
