-- ICON MUN: team questionnaires (security / volunteer / media) have long questions,
-- so the saved answers need more room than the old 3000-byte limit.
-- Raises the limit on applications.details to 20000 bytes. Safe to run more than once.
alter table public.applications drop constraint if exists applications_details_size;
alter table public.applications add constraint applications_details_size
  check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 20000);
