# ICON MUN admin panel - setup

The panel lives at `/admin` (e.g. `http://localhost:3000/admin`). It is a separate lazy-loaded chunk,
so public visitors never download it. All security is enforced by the database (`supabase/schema.sql`),
not by the website code.

## One-time setup
1. Create a Supabase project.
2. Supabase > SQL Editor > New query: paste `supabase/schema.sql`, run. (Safe to run again.)
3. New query: paste `supabase/seed.sql`, run. This loads the content the site shows today, so you can edit it.
4. Supabase > Authentication > Users > Add user (email + password, tick "Auto confirm user").
5. Edit `supabase/make_admin.sql` with that email and run it. (That is what makes the user an organiser.)
6. Supabase > Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
7. Supabase > Project Settings > API: copy the Project URL and the `anon` public key.
8. Create `.env` (never committed) in the project root:
       VITE_SUPABASE_URL=https://xxxx.supabase.co
       VITE_SUPABASE_ANON_KEY=eyJ...
   On Vercel: Project > Settings > Environment Variables, same two names, then redeploy.
9. `npm run dev`, open `/admin`, sign in.

Never put the `service_role` key anywhere in this project.

## Add or remove an organiser
- Add: Authentication > Users > Add user, then run `make_admin.sql` with their email.
- Remove: `delete from public.admins where lower(email) = lower('their@email.com');`

## What each area does
- Dashboard: registration counts, 14-day chart, open/close registration switch.
- Applications: search, filter, status, private notes, CSV export, delete.
- Councils / Schedule days / Schedule events / Secretariat: add, edit, reorder, hide (eye icon), delete.
- Site settings: footer contact details, social links, registration switch.
- Activity log: who changed what (written by the database, cannot be edited from the site).

## Good to know
- If Supabase is down or not configured, the public site shows its built-in default content.
- Deletes are permanent. Export the CSV regularly. The Supabase free plan pauses after about a week of inactivity.
- Changing an application status does not email the delegate.
- Panel signs you out after 60 minutes of inactivity.
- Registration collects names and emails (probably of students): add a real privacy notice before launch.

## Registration switches and team applications

Run `supabase/team_applications.sql` once in the Supabase SQL Editor (it is safe to run again). It adds the four registration tracks: delegate, volunteer, security and media.

In the admin panel, **Registry > Registration** shows one card per track:

- **Accepting applications** is the on/off switch. It saves immediately.
- **Opens at / Closes at** are optional. A track accepts applications only while the switch is on and the current time is inside those dates, so it opens and closes by itself.
- **Closed message** is what visitors see when a track is closed (for example `Closed` or `Full`).

The database enforces the same rule, so a closed track rejects applications even if someone bypasses the website. Team applications appear under **Registry > Applications**, in their own tabs.
