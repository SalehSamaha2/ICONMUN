# ICON MUN 2027 — Project Handoff

> Read this first in any new chat or when handing the project to someone. Keep it current: after every feature, update "Current state" and the changelog.
> **Never put passwords, API keys or private emails in this file.**

## What it is
Official website for ICON MUN 2027 (a Model UN conference). Public site with cinematic intro/hero animations, councils, schedule, registration, and a private `/admin` console for the organisers.

## Stack
- React 19 + Vite 8 + TypeScript, Tailwind v4, GSAP + Lenis (smooth scroll), lucide icons
- Supabase (Postgres + Row Level Security + Storage + Auth) for applications and content
- Hosting: Vercel (free tier), deploys automatically from GitHub on push
- Local dev server: `npm run dev` → **http://localhost:3000** (port set in package.json)

## Repos and people
- Saleh's repo (his `origin`): `SalehSamaha2/ICONMUN`, local folder `~/Desktop/Icon-MUN` (Ubuntu laptop)
- Co-developer (Mohammed Magdi) works in `diavlo3444-create/ICONMUN` and changes arrive by pull request / pull. Check `git remote -v` to see what each remote points to.
- Asset source repo: `ahmedmagdialkik-blip/Icon-MUN` holds `public/assets` (see Gotchas)
- Saleh controls the Supabase project (he runs all SQL). Claude never has direct access to it.

## Theme
Black background, beige text, burgundy/gold accents (final logo = masquerade mask on beige). Not black-and-gold.

## Features (what exists today)
1. **Public site**: intro video + "Enter Experience", scroll-scrubbed hero, councils, schedule, secretariat (SG photo crop `center 85%`), visitor guide.
2. **Delegate registration** (`RegistrationSection.tsx`): name, school, email, committee/country preferences, statement, **certificate images (required, up to 10)**, consent.
3. **Team applications**: Volunteer / Security / Media (`TeamApplicationModal.tsx`, `src/lib/tracks.ts`), department-specific questionnaires, minimum word counts, emergency contact, **certificate images (required, up to 10)**.
4. **Registration windows**: each track (delegate/volunteer/security/media) can be opened/closed by the SG; enforced in the database (`registration_tracks`, `track_is_open()`).
5. **Form validation**: pressing Submit highlights ALL missing fields at once (red outline + message + count), live-clearing as fixed (`FieldError.tsx`, `src/lib/formErrors.ts`).
6. **Certificate uploads**: private Storage bucket `application-proofs`; images shrunk in the browser (max 1800px JPEG), 5 MB cap each; stored as paths in `applications.proofs`.
7. **Admin console** `/admin` (hash routes): dashboard, registrations, applications (review workspace, CSV export), website content, check-in (QR scanner), activity log, settings.
8. **Roles**:
   - **SG** (row in `admins`, `is_admin()`): sees everything; the only one who can delete applications, set the FINAL status, open/close tracks.
   - **Heads** (`track_heads` table): Head of Security / Media / Volunteers. See ONLY applications of their own track, plus its certificate images. Can set a non-final "Head's decision" (Accept/Waitlist/Reject/Under review) and notes. Cannot delete or touch anything else. More than one head per track is allowed. The SG is also head of delegates.
   - Head actions appear in the activity log (visible only to the SG).
9. **QR event passes**: accepted applicants get a QR pass in the pass portal; admins without an accepted application get an admin pass. Scanning (entry/exit) is limited to admins, accepted Security members and the Head of Security.
10. **Popup scrolling**: popups/drawers use `data-lenis-prevent` and a global Lenis `prevent` rule, and the page behind is frozen (`html:has(.fixed[data-lenis-prevent])` in `index.css`).

## Database (Supabase)
Base: `supabase/schema.sql` (tables, RLS, triggers, storage). Extra SQL is applied from `supabase/` and `supabase/migrations/` **in this order** (all are safe to run twice):
1. `schema.sql` (base; includes team applications + track heads)
2. `migrations/20261029_applicant_portal_checkin.sql`
3. `migrations/20261102000000_qr_pass_security_scanner.sql`
4. `migrations/20261103000000_admin_account_qr_passes.sql` — **has a bug: use the fixed copy** (adds `#variable_conflict use_column`). The fixed version should replace this file in the repo.
5. `migrations/20261105000000_application_proofs.sql` — proofs column, private bucket, storage policies, Head of Security can scan
6. `migrations/20261106000000_raise_details_limit.sql` — team answers limit 3000 → 20000 bytes
7. `migrations/20261107000000_require_proofs.sql` — at least one image required (run ONLY after the site with the upload box is live)
8. `migrations/20261108000000_proofs_max10.sql` — up to 10 images

> **Status of each step on the live Supabase is not recorded here — tick them off below as you confirm them.**
- [ ] 1  [ ] 2  [ ] 3  [ ] 4 (fixed copy)  [ ] 5  [ ] 6  [ ] 7  [ ] 8

Key objects: `applications` (`track`, `status` = SG's final status, `head_decision/_by/_at`, `head_notes`, `proofs`, `details` jsonb), `admins`, `track_heads`, `registration_tracks`, `audit_log`, `event_passes`, `event_account_passes`, `event_pass_scan_logs`; functions `is_admin()`, `head_track()`, `track_is_open()`, `can_scan_event_pass()`, `my_event_passes()`, `scan_event_pass()`.

Security design (do not weaken): applicants can only INSERT (anon); heads are limited by RLS + a column-guard trigger (`guard_head_update`); only the SG deletes; storage bucket is private (admins/heads read via signed URLs); heads can technically read `internal_notes` through the API though the UI hides it.

## Gotchas learned the hard way
- **`public/assets` is not in code zips.** If the intro/hero animations vanish, the folder is missing. Restore: `git clone --depth 1 https://github.com/ahmedmagdialkik-blip/Icon-MUN.git ahmed-copy && cp -r ahmed-copy/public/assets Icon-MUN/public/`
- Dev server is on **port 3000**, not 5173.
- On insert, a trigger forces new applications to status `new` (you cannot insert `accepted` as a visitor).
- Don't use the `.gold-card` class on scrollable modals (it sets `overflow:hidden`).
- Lenis hijacks the mouse wheel; any new popup needs `data-lenis-prevent`.
- Run SQL in Supabase SQL Editor; when code and SQL both change, deploy code first when the SQL makes something mandatory.
- Anyone given an admin/head account must get a strong, private password; passwords pasted into chats are burned.

## Heads accounts (how to add one)
1. Supabase → Authentication → Users → Add user (auto-confirm). Use a strong password.
2. SQL Editor:
```sql
insert into public.track_heads (user_id, email, track)
select id, email, 'security' from auth.users where lower(email) = lower('head@example.com');
-- track: volunteer | security | media
```
Remove: `delete from public.track_heads where email = 'head@example.com';`
Six heads were set up (2 security, 2 media, 2 volunteer).

## Open items / ideas
- Replace the buggy original `20261103000000…` migration file in the repo with the fixed one.
- Decide: certificates required for everyone vs only for applicants who claim experience (Claude's recommendation: conditional; required-for-all will cost first-time applicants).
- Possible dead links to `/portal` in `ConferenceInfoSection.tsx` / `Navigation.tsx` (check against the current pass portal route).
- Clean orphan images in storage occasionally (uploads without a submitted application).
- Privacy policy should mention uploaded certificate images (applicants may be under 18).
