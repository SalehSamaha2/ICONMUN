-- ICON MUN: allow up to 10 certificate / proof images per application (was 5).
-- Safe to run more than once.
alter table public.applications drop constraint if exists applications_proofs_max5;
alter table public.applications drop constraint if exists applications_proofs_max10;
alter table public.applications
  add constraint applications_proofs_max10 check (cardinality(proofs) <= 10);
