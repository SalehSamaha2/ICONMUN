# How we work: build, test, push, and see changes

Written for Saleh's Ubuntu laptop. Project folder: `~/Desktop/Icon-MUN`.

## The normal loop (Claude gives you a patch)
Claude can't push to GitHub for you. Claude builds the change in its own sandbox, tests it, and sends a `.patch` file (code) and sometimes a `.sql` file (database). You:

```bash
cd ~/Desktop/Icon-MUN
git status                       # should be clean before you start
git pull origin main             # get the newest code first
git apply ~/Downloads/NAME.patch # apply Claude's change (prints nothing if OK)
npm run dev                      # open http://localhost:3000 and test
```
If it looks right, stop the server (Ctrl+C) and publish:
```bash
git add -A
git commit -m "Short description of the change"
git push origin main             # Vercel then redeploys the live site
```
If it is wrong: `git restore . && git clean -fd src supabase` (throws away uncommitted changes — only do it if you have no work of your own in progress).

### If `git apply` fails
- "patch does not apply" → your files are not the version the patch was built from. Run `git pull origin main`, then `git status`; send Claude the output and the error. Claude will rebuild the patch against your files.
- "No such file" → the download has a different name: `ls ~/Downloads | grep patch`.
- Never edit the patch or the code by hand; ask Claude to regenerate.

## SQL changes (Supabase)
1. Supabase dashboard → your ICON MUN project → SQL Editor → New query.
2. In the terminal: `cat ~/Desktop/Icon-MUN/supabase/migrations/FILE.sql` (or open the downloaded file), copy everything, paste, Run.
3. Files are written to be safe to run twice. If there is an error, copy the exact message to Claude.
4. **Order:** code that the SQL depends on goes live first when the SQL makes something mandatory (e.g. required images).

## See the latest changes from GitHub (what did my friend push?)
```bash
git fetch origin                          # download info, change nothing
git log --oneline HEAD..origin/main       # new commits you don't have yet
git diff --stat HEAD..origin/main         # which files they touch
git pull origin main                      # actually bring them in
git log --oneline -10                     # your last 10 commits
```
Before asking Claude for a new feature, **pull first**, so Claude builds on the newest code. Tell Claude to re-check the GitHub repo.

## Starting a new chat with Claude
1. Run `cd ~/Desktop && zip -r icon-mun.zip Icon-MUN -x "Icon-MUN/.git/*" "Icon-MUN/node_modules/*" "Icon-MUN/public/assets/*"` only if you want Claude to see local, unpushed work.
2. Tell Claude: "Read docs/HANDOFF.md and docs/WORKFLOW.md in the ICON MUN repo / the Brain."
3. At the end of any chat, ask: "Update the HANDOFF and CHANGELOG with what we did today."

## Heads and roles quick reference
See HANDOFF.md → "Heads accounts". Passwords: create them in Supabase only; never paste them in a chat.

## Testing approach Claude uses (so you know what "tested" means)
- SQL is tested on a local Postgres copy with fake users (SG, head, applicant, stranger): who can read/write/delete what.
- UI is tested in a real browser (Playwright) against a fake Supabase, on laptop/tablet/phone sizes.
- Claude cannot test on your real Supabase project; the first real run is yours, so always do the local test step.
