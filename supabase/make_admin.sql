-- Make a user an organiser.
-- 1) Supabase > Authentication > Users > Add user (email + password, tick "Auto confirm").
-- 2) Put that SAME email below, then run this in the SQL Editor.
insert into public.admins (user_id, email)
select id, email from auth.users where lower(email) = lower('PUT-THE-ORGANISER-EMAIL-HERE@example.com')
on conflict (user_id) do nothing;

-- Check it worked (you should see one row):
select * from public.admins;

-- To REMOVE an organiser:
-- delete from public.admins where lower(email) = lower('their-email@example.com');
