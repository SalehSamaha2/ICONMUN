# Changelog (newest last)

Dates are 2026. Work done with Claude; code applied by Saleh.

## Late Oct — look and behaviour
- Final logo + favicon; theme set to black and beige (not black and gold); black page background.
- Intro "Enter Experience" fixed (it hung when the video was missing; now bails after 1.5s).
- Found that animations were missing because `public/assets` wasn't in the folder and it wasn't a git repo → restored assets, set up git, ignored `.vite/`.
- Reviewed the co-developer's changes (redesigned admin, QR check-in, applicant portal).

## Team applications + registration windows
- Volunteer / Security / Media applications beside delegate registration; the SG can open and close each track; limits enforced in the database (3 per email per track, flood guard).
- SG photo moved higher in the crop (`center 85%`).

## Head accounts (admin roles)
- Heads of volunteers / security / media sign into `/admin` and see only their own track's applications.
- Option B chosen: a head's decision is a non-final recommendation; the SG sets the final status and is the only one who can delete.
- `track_heads` table, head-decision columns, RLS, column-guard trigger, activity logging; admin shell locks heads to the Applications page.
- Tested on a local database copy and in a real browser with a fake Supabase. Six head accounts created by Saleh.

## QR passes and scanning
- Reviewed the co-developer's `admin_account_qr_passes` migration: **found a bug** (ambiguous column names made `my_event_passes()` fail). Fixed with `#variable_conflict use_column`.
- Scanning restricted to admins, accepted Security members, and the Head of Security.

## Certificate uploads
- Applicants upload photos of certificates (private bucket, resized in the browser, stored in `applications.proofs`); SG and the right head can view them in the admin drawer; deleting an application deletes its images.
- Now **required** on every form and up to **10** images; database enforces it.
- Upload box is a big tap/drop area, works on laptop/tablet/phone.

## Forms and scrolling
- Submitting now highlights every missing field at once with messages and a count.
- Fixed "combined answers exceed the database storage limit" (limit raised to 20000 bytes in code and DB).
- Fixed popup scrolling moving the page behind (Lenis `prevent` rule, `data-lenis-prevent`, page frozen behind popups).

## Docs
- Added `docs/HANDOFF.md`, `docs/WORKFLOW.md`, `docs/CHANGELOG.md` and "The Brain" starter.
