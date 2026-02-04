# Central Brain — Build/Deploy Status

Last updated: 2026-02-03

## Objective
Ship a private Second Brain + Tasks dashboard (Next.js + Supabase + Netlify) usable by:
- barttheai@gmail.com
- darkziga1999@gmail.com

## Deployment blockers
- Netlify Secrets Scanning fails if public `NEXT_PUBLIC_*` vars are marked as **Secret**.

## Stage Plan (chunked)

### Stage 1 — Foundation (Repo/App/Auth)
**Success:** repo builds locally; Supabase Auth magic link pages exist.
- [x] Repo created: https://github.com/barttheai-hub/central-brain
- [x] Next.js scaffold committed
- [x] Supabase SSR auth skeleton committed
- [x] Local build passes (`npm run build`)
**Verify:** `npm run build` exits 0.
**If error:** fix TS/build errors, commit.

### Stage 2 — Supabase schema + RLS
**Success:** tables exist; RLS restricts to 2 emails; seed businesses.
- [x] Schema applied in Supabase SQL editor
- [x] RLS helper `public.is_allowed_user()` uses: barttheai@gmail.com + darkziga1999@gmail.com
**Verify:** Supabase Table Editor shows tables; simple select works for allowed users.
**If error:** rerun SQL, inspect error line, patch schema.sql, commit.

### Stage 3 — Netlify env vars (correct types)
**Success:** Deploy passes; site serves Next app.
Steps:
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` remains **Secret**
- [ ] Re-create `NEXT_PUBLIC_SUPABASE_URL` as **non-secret** env var
- [ ] Re-create `NEXT_PUBLIC_SUPABASE_ANON_KEY` as **non-secret** env var
- [ ] Trigger deploy
**Verify:** Deploy log shows success; `https://centralbrain2.netlify.app/login` loads.
**If error:** open deploy details; inspect failing step; apply fix; redeploy.

### Stage 4 — Domain
**Success:** busybodyadmin.com serves the same app.
- [ ] Confirm Netlify domain points to centralbrain2 site
**Verify:** http(s) busybodyadmin.com shows Next app.

### Stage 5 — MVP Features (UI)
**Success:** usable Second Brain + Tasks.
- [ ] Sidebar nav: Businesses, Notes, Research, Tasks (Ziga/Bart), Reports
- [ ] CRUD: notes, tasks, research topics/messages
- [x] Global search (v1: title/body ilike)
- [x] Activity log (simple append-only events)
**Verify:** create/edit/delete flows work as logged-in users.

### Stage 6 — Daily workflow
**Success:** nightly plan message process defined.
- [ ] Spec: what inputs define priorities
- [ ] Output template for nightly plan

## Logging
- Each stage completion is checked off here and committed.
- Errors: add a short note under the stage with the fix + link to deploy/build log if relevant.
